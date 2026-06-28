import type { NormalizedGovernmentRecord } from "@/lib/record-sources/types";
import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { LiveFetchResult } from "./live-fetch";
import { classifySourceUrl } from "./source-filter";

export const MIN_CERTAINTY_FOR_LEAD_QUEUE = 65;
export const MIN_CERTAINTY_FOR_PIPELINE_ITEM = 45;

export interface SourceCertaintyFactor {
  id: string;
  label: string;
  points: number;
  met: boolean;
}

export interface SourceCertaintyResult {
  score: number;
  hasSourceProof: boolean;
  isEnrichmentOnly: boolean;
  factors: SourceCertaintyFactor[];
  fetchMethod: "live_http" | "snippet_only" | "arcgis_api";
  contentHash: string | null;
  hostnameMatch: boolean;
  multiSourceCorroborated: boolean;
}

function factor(id: string, label: string, points: number, met: boolean): SourceCertaintyFactor {
  return { id, label, points, met };
}

export function evaluateSourceCertainty(input: {
  record: Pick<
    NormalizedGovernmentRecord,
    | "source_url"
    | "source_name"
    | "source_type"
    | "property_address"
    | "decedent_name"
    | "estate_case_number"
    | "deed_reference"
    | "parcel_id"
    | "personal_representative"
    | "transfer_date"
    | "mailing_address"
    | "media_url"
    | "raw_payload"
  >;
  liveFetch?: LiveFetchResult | null;
  trustLevel?: "official" | "official_secondary" | "enrichment" | "rejected";
  corroboratingSourceTypes?: string[];
}): SourceCertaintyResult {
  const classification = classifySourceUrl(input.record.source_url, true);
  const hostnameMatch = classification.allowed && classification.trustLevel !== "rejected";
  const liveOk = input.liveFetch?.ok === true;
  const fetchMethod = input.liveFetch?.fetchMethod ?? "snippet_only";
  const contentHash =
    (input.liveFetch?.contentHash as string | null)
    ?? (input.record.raw_payload?.contentHash as string | null)
    ?? null;

  const isEnrichmentOnly =
    input.trustLevel === "enrichment"
    || /enrichment|people-search|phone|email/i.test(input.record.source_type);

  const factors: SourceCertaintyFactor[] = [
    factor("official_hostname", "Official government hostname verified", 20, hostnameMatch),
    factor("live_fetch", "Live source URL fetched and verified", 18, liveOk),
    factor("content_hash", "Source content hash captured for audit", 8, Boolean(contentHash)),
    factor("property_address", "Property address extracted from official record", 12, Boolean(input.record.property_address)),
    factor("estate_signal", "Estate/probate signal in official record", 12, Boolean(input.record.decedent_name || input.record.estate_case_number)),
    factor("deed_reference", "Deed/instrument reference extracted", 10, Boolean(input.record.deed_reference)),
    factor("parcel_id", "Parcel/account ID extracted", 10, Boolean(input.record.parcel_id)),
    factor("personal_rep", "Personal representative identified", 8, Boolean(input.record.personal_representative)),
    factor("transfer_date", "Transfer date extracted", 6, Boolean(input.record.transfer_date)),
    factor("property_visual", "Official property visual/map URL attached", 8, Boolean(input.record.media_url)),
    factor(
      "multi_source",
      "Corroborated by multiple distinct official source types",
      15,
      (input.corroboratingSourceTypes?.length ?? 0) >= 2
    ),
  ];

  if (isEnrichmentOnly) {
    factors.push(factor("enrichment_cap", "Enrichment-only source (not proof)", -30, true));
  }

  const score = Math.max(0, Math.min(100, factors.filter((f) => f.met).reduce((s, f) => s + f.points, 0)));

  const hasStructuredProof =
    Boolean(input.record.property_address)
    || Boolean(input.record.decedent_name)
    || Boolean(input.record.estate_case_number)
    || Boolean(input.record.deed_reference)
    || Boolean(input.record.parcel_id);

  const hasSourceProof =
    hostnameMatch
    && hasStructuredProof
    && !isEnrichmentOnly
    && (liveOk || fetchMethod === "arcgis_api" || score >= 50);

  return {
    score,
    hasSourceProof,
    isEnrichmentOnly,
    factors,
    fetchMethod,
    contentHash,
    hostnameMatch,
    multiSourceCorroborated: (input.corroboratingSourceTypes?.length ?? 0) >= 2,
  };
}

export function applyCertaintyToNormalizedRecord(
  record: NormalizedGovernmentRecord,
  certainty: SourceCertaintyResult
): NormalizedGovernmentRecord {
  return {
    ...record,
    source_certainty_score: certainty.score,
    has_source_proof: certainty.hasSourceProof,
    fetch_method: certainty.fetchMethod,
    content_hash: certainty.contentHash,
    certainty_factors: certainty.factors.filter((f) => f.met).map((f) => f.label),
    confidence_score: Math.max(record.confidence_score, certainty.score),
    raw_payload: {
      ...record.raw_payload,
      sourceCertainty: certainty.score,
      certaintyFactors: certainty.factors,
      contentHash: certainty.contentHash,
      hasSourceProof: certainty.hasSourceProof,
    },
  };
}

export function toGovernmentRecordWithCertainty(
  record: NormalizedGovernmentRecord
): GovernmentNormalizedRecord {
  return {
    sourceName: record.source_name,
    sourceType: record.source_type,
    sourceUrl: record.source_url,
    jurisdiction: `${record.jurisdiction_county} County, ${record.jurisdiction_state}`,
    recordType: record.record_type,
    propertyAddress: record.property_address,
    ownerName: record.owner_name,
    transferDate: record.transfer_date,
    deedReference: record.deed_reference,
    estateCaseNumber: record.estate_case_number,
    decedentName: record.decedent_name,
    personalRepresentative: record.personal_representative,
    interestedPersons: record.interested_persons,
    mailingAddress: record.mailing_address,
    confidenceScore: record.confidence_score,
    sourceCertaintyScore: record.source_certainty_score,
    hasSourceProof: record.has_source_proof,
    fetchMethod: record.fetch_method,
    contentHash: record.content_hash,
    rawPayload: record.raw_payload,
    title: record.title,
    snippet: record.snippet,
  };
}

export function filterRecordsWithSourceProof(
  records: NormalizedGovernmentRecord[],
  minScore = MIN_CERTAINTY_FOR_PIPELINE_ITEM
): NormalizedGovernmentRecord[] {
  return records.filter(
    (r) => r.has_source_proof !== false && (r.source_certainty_score ?? 0) >= minScore
  );
}

export function groupCorroboratingSourceTypes(records: NormalizedGovernmentRecord[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const record of records) {
    const key = (record.property_address ?? record.decedent_name ?? record.title).toLowerCase();
    const types = map.get(key) ?? [];
    if (!types.includes(record.source_type)) types.push(record.source_type);
    map.set(key, types);
  }
  return map;
}
