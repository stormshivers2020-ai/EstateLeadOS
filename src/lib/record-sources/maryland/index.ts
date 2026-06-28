import type { NormalizedGovernmentRecord } from "../types";
import { getConnectorsForCounty } from "./county-template";
import { parseHitToNormalizedRecord } from "../registry";
import { searchInternet } from "@/lib/services/lead-discovery/internet-search";
import { enrichRecordWithLiveFetch } from "@/lib/services/government/live-fetch";
import {
  applyCertaintyToNormalizedRecord,
  evaluateSourceCertainty,
  filterRecordsWithSourceProof,
  groupCorroboratingSourceTypes,
  MIN_CERTAINTY_FOR_PIPELINE_ITEM,
} from "@/lib/services/government/source-certainty";
import { fetchHarfordParcels } from "./harford-arcgis";

export { getConnectorsForCounty, getMarylandCountyBundles, buildCountyConnectorBundle } from "./county-template";
export { MARYLAND_COUNTIES } from "./counties";
export type { NormalizedGovernmentRecord, RecordSourceConnector, CountyConnectorBundle } from "../types";

async function processHit(
  hit: { title: string; url: string; content: string },
  connector: ReturnType<typeof getConnectorsForCounty>[number],
  market: { state: string; county: string }
): Promise<NormalizedGovernmentRecord | null> {
  const { liveFetch, mergedText, fields } = await enrichRecordWithLiveFetch({
    url: hit.url,
    title: hit.title,
    snippet: hit.content,
    state: market.state,
  });

  const record = parseHitToNormalizedRecord(
    hit,
    {
      sourceName: connector.sourceName,
      sourceType: connector.sourceType,
      jurisdictionState: connector.jurisdictionState,
      jurisdictionCounty: connector.jurisdictionCounty,
      trustLevel: connector.trustLevel,
    },
    market,
    {
      mergedText,
      liveFetchOk: liveFetch.ok,
      contentHash: liveFetch.contentHash,
      fetchMethod: liveFetch.fetchMethod,
    }
  );

  if (!record) return null;

  if (!record.property_address && fields.propertyAddress) record.property_address = fields.propertyAddress;
  if (!record.parcel_id && fields.parcelId) record.parcel_id = fields.parcelId;
  if (!record.transfer_date && fields.transferDate) record.transfer_date = fields.transferDate;

  const certainty = evaluateSourceCertainty({
    record,
    liveFetch,
    trustLevel: connector.trustLevel,
  });

  return applyCertaintyToNormalizedRecord(record, certainty);
}

export async function runCountyConnectors(input: {
  stateAbbr: string;
  countyName: string;
  city?: string;
  maxPerConnector?: number;
}): Promise<{
  records: NormalizedGovernmentRecord[];
  queries: string[];
  sourcesQueried: number;
  manualReviewTasks: Array<{ sourceName: string; reason: string }>;
  liveFetchCount: number;
  arcgisCount: number;
  rejectedLowCertainty: number;
}> {
  const connectors = getConnectorsForCounty(input.stateAbbr, input.countyName);
  const queries: string[] = [];
  const records: NormalizedGovernmentRecord[] = [];
  const manualReviewTasks: Array<{ sourceName: string; reason: string }> = [];
  const seen = new Set<string>();
  const max = input.maxPerConnector ?? 3;
  let liveFetchCount = 0;
  let arcgisCount = 0;

  const market = { state: input.stateAbbr, county: input.countyName, city: input.city };

  // Live ArcGIS parcel pull for proof-engine counties
  if (input.countyName === "Harford" && input.stateAbbr === "MD") {
    const arcgisRecords = await fetchHarfordParcels({ county: input.countyName, state: input.stateAbbr, limit: 6 });
    for (const r of arcgisRecords) {
      const key = (r.parcel_id ?? r.property_address ?? r.title).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      records.push(r);
      arcgisCount++;
    }
  }

  for (const connector of connectors) {
    if (connector.fetchLiveRecords) {
      const live = await connector.fetchLiveRecords({ ...market, limit: max });
      for (const r of live) {
        const key = (r.parcel_id ?? r.property_address ?? r.source_url).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        records.push(r);
      }
    }

    if (connector.mode === "manual_review_only" || connector.requiresManualLogin) {
      manualReviewTasks.push({
        sourceName: connector.sourceName,
        reason: "Source requires manual login — create manual review task instead of automated scrape",
      });
      continue;
    }

    const connectorQueries = connector.buildQueries(market);
    queries.push(...connectorQueries);

    for (const query of connectorQueries) {
      const hits = await searchInternet(query, max);
      for (const hit of hits) {
        const key = hit.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const record = await processHit(hit, connector, market);
        if (record) {
          if (record.fetch_method === "live_http") liveFetchCount++;
          records.push(record);
        }
      }
    }
  }

  const corroboration = groupCorroboratingSourceTypes(records);
  const withCorroboration = records.map((r) => {
    const key = (r.property_address ?? r.decedent_name ?? r.title).toLowerCase();
    const types = corroboration.get(key) ?? [];
    const certainty = evaluateSourceCertainty({
      record: r,
      trustLevel: "official",
      corroboratingSourceTypes: types,
      liveFetch:
        r.fetch_method === "live_http"
          ? { ok: true, fetchMethod: "live_http", contentHash: r.content_hash ?? null } as import("@/lib/services/government/live-fetch").LiveFetchResult
          : r.fetch_method === "arcgis_api"
            ? { ok: true, fetchMethod: "arcgis_api", contentHash: null } as import("@/lib/services/government/live-fetch").LiveFetchResult
            : null,
    });
    return applyCertaintyToNormalizedRecord(r, certainty);
  });

  const proven = filterRecordsWithSourceProof(withCorroboration, MIN_CERTAINTY_FOR_PIPELINE_ITEM);
  const rejectedLowCertainty = withCorroboration.length - proven.length;

  return {
    records: proven.sort((a, b) => (b.source_certainty_score ?? 0) - (a.source_certainty_score ?? 0)),
    queries,
    sourcesQueried: connectors.length,
    manualReviewTasks,
    liveFetchCount,
    arcgisCount,
    rejectedLowCertainty,
  };
}
