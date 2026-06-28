import "server-only";

import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { InternetSearchHit } from "@/lib/services/lead-discovery/types";
import { searchInternet, isInternetSearchConfigured } from "@/lib/services/lead-discovery/internet-search";
import { buildConnectorQueries, getConnectorsForMarket } from "../record-parser";
import { enrichRecordWithLiveFetch } from "../live-fetch";
import { extractRecordFields } from "../field-extractor";
import { hitToGovernmentRecord } from "../record-parser";
import {
  applyCertaintyToNormalizedRecord,
  evaluateSourceCertainty,
  filterRecordsWithSourceProof,
  groupCorroboratingSourceTypes,
  MIN_CERTAINTY_FOR_LEAD_QUEUE,
  toGovernmentRecordWithCertainty,
} from "../source-certainty";
import type { NormalizedGovernmentRecord } from "@/lib/record-sources/types";

export { isInternetSearchConfigured as isGovernmentSearchConfigured };

function toNormalizedFromGov(r: GovernmentNormalizedRecord): NormalizedGovernmentRecord {
  const [county, statePart] = r.jurisdiction.split(",").map((s) => s.trim());
  return {
    source_name: r.sourceName,
    source_type: r.sourceType,
    jurisdiction_state: statePart?.replace(/\s*County$/, "").slice(-2) ?? "MD",
    jurisdiction_county: county?.replace(/\s*County$/, "") ?? "",
    source_url: r.sourceUrl,
    record_type: r.recordType,
    property_address: r.propertyAddress,
    owner_name: r.ownerName,
    decedent_name: r.decedentName,
    estate_case_number: r.estateCaseNumber,
    personal_representative: r.personalRepresentative,
    interested_persons: r.interestedPersons ?? [],
    mailing_address: r.mailingAddress,
    transfer_date: r.transferDate,
    deed_reference: r.deedReference,
    parcel_id: null,
    tax_account_id: null,
    media_url: null,
    confidence_score: r.confidenceScore,
    source_certainty_score: r.sourceCertaintyScore,
    has_source_proof: r.hasSourceProof,
    fetch_method: r.fetchMethod,
    content_hash: r.contentHash,
    raw_payload: r.rawPayload,
    title: r.title,
    snippet: r.snippet,
  };
}

export async function runGovernmentConnectors(input: {
  state: string;
  county: string;
  city?: string;
  maxResultsPerConnector?: number;
}): Promise<{
  records: GovernmentNormalizedRecord[];
  queries: string[];
  hitsScanned: number;
  connectorsRun: number;
  liveFetchCount: number;
  rejectedLowCertainty: number;
}> {
  const connectors = getConnectorsForMarket(input.state, input.county);
  const queries: string[] = [];
  const seen = new Set<string>();
  const normalized: NormalizedGovernmentRecord[] = [];
  let hitsScanned = 0;
  let liveFetchCount = 0;
  const maxPer = input.maxResultsPerConnector ?? 4;

  for (const connector of connectors) {
    const connectorQueries = buildConnectorQueries(
      { sourceName: connector.sourceName, baseUrl: connector.baseUrl, sourceType: connector.sourceType },
      { state: input.state, county: input.county, city: input.city }
    );
    queries.push(...connectorQueries);

    for (const query of connectorQueries) {
      const hits = await searchInternet(query, maxPer);
      hitsScanned += hits.length;

      for (const hit of hits) {
        const key = hit.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const { liveFetch, mergedText, fields } = await enrichRecordWithLiveFetch({
          url: hit.url,
          title: hit.title,
          snippet: hit.content,
          state: input.state,
        });
        if (liveFetch.ok) liveFetchCount++;

        const base = hitToGovernmentRecord(
          { ...hit, content: mergedText } as InternetSearchHit,
          { sourceName: connector.sourceName, sourceType: connector.sourceType, registryId: connector.id },
          { state: input.state, county: input.county }
        );
        if (!base) continue;

        if (!base.propertyAddress && fields.propertyAddress) base.propertyAddress = fields.propertyAddress;
        if (!base.deedReference && fields.deedReference) base.deedReference = fields.deedReference;
        base.rawPayload = {
          ...base.rawPayload,
          liveFetchOk: liveFetch.ok,
          contentHash: liveFetch.contentHash,
        };
        base.fetchMethod = liveFetch.fetchMethod;
        base.contentHash = liveFetch.contentHash;

        const norm = toNormalizedFromGov(base);
        if (fields.parcelId) norm.parcel_id = fields.parcelId;
        if (fields.transferDate) norm.transfer_date = fields.transferDate;

        const certainty = evaluateSourceCertainty({
          record: norm,
          liveFetch,
          trustLevel: connector.trustLevel as "official" | "official_secondary",
        });
        normalized.push(applyCertaintyToNormalizedRecord(norm, certainty));
      }
    }
  }

  const corroboration = groupCorroboratingSourceTypes(normalized);
  const withCorroboration = normalized.map((r) => {
    const key = (r.property_address ?? r.decedent_name ?? r.title).toLowerCase();
    const certainty = evaluateSourceCertainty({
      record: r,
      corroboratingSourceTypes: corroboration.get(key),
      liveFetch:
        r.fetch_method === "live_http"
          ? { ok: true, fetchMethod: "live_http", contentHash: r.content_hash ?? null } as import("../live-fetch").LiveFetchResult
          : null,
    });
    return applyCertaintyToNormalizedRecord(r, certainty);
  });

  const proven = filterRecordsWithSourceProof(withCorroboration, MIN_CERTAINTY_FOR_LEAD_QUEUE);
  const rejectedLowCertainty = withCorroboration.length - proven.length;

  return {
    records: proven.map(toGovernmentRecordWithCertainty),
    queries,
    hitsScanned,
    connectorsRun: connectors.length,
    liveFetchCount,
    rejectedLowCertainty,
  };
}
