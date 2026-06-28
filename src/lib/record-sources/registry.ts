import type { NormalizedGovernmentRecord } from "./types";
import { classifySourceUrl } from "@/lib/services/government/source-filter";
import { extractRecordFields } from "@/lib/services/government/field-extractor";

export function parseHitToNormalizedRecord(
  hit: { title: string; url: string; content: string },
  connector: {
    sourceName: string;
    sourceType: string;
    jurisdictionState: string;
    jurisdictionCounty?: string | null;
    trustLevel?: "official" | "official_secondary" | "enrichment" | "rejected";
  },
  market: { state: string; county: string },
  enriched?: {
    mergedText?: string;
    liveFetchOk?: boolean;
    contentHash?: string | null;
    fetchMethod?: "live_http" | "snippet_only" | "arcgis_api";
  }
): NormalizedGovernmentRecord | null {
  const classification = classifySourceUrl(hit.url, true);
  if (!classification.allowed) return null;

  const blob = enriched?.mergedText ?? `${hit.title}. ${hit.content}`;
  const fields = extractRecordFields(blob, market.state);

  if (!fields.propertyAddress && !fields.decedentName && !fields.hasEstateSignal) return null;

  const confidence =
    40
    + (fields.propertyAddress ? 20 : 0)
    + (fields.decedentName ? 18 : 0)
    + (fields.hasEstateSignal ? 12 : 0)
    + (fields.deedReference ? 10 : 0)
    + (fields.parcelId ? 10 : 0)
    + (enriched?.liveFetchOk ? 15 : 0);

  return {
    source_name: connector.sourceName,
    source_type: connector.sourceType,
    jurisdiction_state: connector.jurisdictionState,
    jurisdiction_county: connector.jurisdictionCounty ?? market.county,
    source_url: hit.url,
    record_type: connector.sourceType,
    property_address: fields.propertyAddress,
    owner_name: fields.ownerName ?? fields.decedentName,
    decedent_name: fields.decedentName,
    estate_case_number: fields.estateCaseNumber,
    personal_representative: fields.personalRepresentative,
    interested_persons: [],
    mailing_address: fields.mailingAddress,
    transfer_date: fields.transferDate,
    deed_reference: fields.deedReference,
    parcel_id: fields.parcelId,
    tax_account_id: fields.taxAccountId,
    media_url: /gis|parcel/i.test(connector.sourceType) ? hit.url : null,
    confidence_score: Math.min(92, confidence),
    raw_payload: {
      title: hit.title,
      content: hit.content,
      liveFetchOk: enriched?.liveFetchOk ?? false,
      contentHash: enriched?.contentHash ?? null,
      trustLevel: connector.trustLevel,
    },
    title: hit.title,
    snippet: blob.slice(0, 500),
    fetch_method: enriched?.fetchMethod ?? "snippet_only",
    content_hash: enriched?.contentHash ?? null,
  };
}
