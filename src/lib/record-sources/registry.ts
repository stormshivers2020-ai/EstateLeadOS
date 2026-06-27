import type { NormalizedGovernmentRecord } from "./types";
import { classifySourceUrl } from "@/lib/services/government/source-filter";

const ADDRESS_PATTERN =
  /\d{1,6}\s+[\w\s.'#-]+(?:\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way|Ct|Court|Pl|Place)\b)[,\s]+[\w\s.'-]+,?\s*[A-Z]{2}\b/i;
const DECEDENT = /(?:estate of|decedent|in re:?\s*(?:the\s+)?estate of)\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const PR = /(?:personal representative|executor|administrator)[:\s]+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const CASE = /\b(?:estate|case|file)\s*(?:no\.?|#)?\s*([A-Z0-9-]{4,})/i;
const DEED = /\b(?:deed|instrument|lib|book)\s*(?:no\.?|#)?\s*([A-Z0-9-]{3,})/i;

export function parseHitToNormalizedRecord(
  hit: { title: string; url: string; content: string },
  connector: {
    sourceName: string;
    sourceType: string;
    jurisdictionState: string;
    jurisdictionCounty?: string | null;
  },
  market: { state: string; county: string }
): NormalizedGovernmentRecord | null {
  const classification = classifySourceUrl(hit.url, true);
  if (!classification.allowed) return null;

  const blob = `${hit.title}. ${hit.content}`;
  const propertyAddress = blob.match(ADDRESS_PATTERN)?.[0]?.trim() ?? null;
  const decedent = blob.match(DECEDENT)?.[1]?.trim() ?? null;
  const pr = blob.match(PR)?.[1]?.trim() ?? null;
  const hasEstate = /probate|estate|decedent|register of wills/i.test(blob);

  if (!propertyAddress && !decedent && !hasEstate) return null;

  return {
    source_name: connector.sourceName,
    source_type: connector.sourceType,
    jurisdiction_state: connector.jurisdictionState,
    jurisdiction_county: connector.jurisdictionCounty ?? market.county,
    source_url: hit.url,
    record_type: connector.sourceType,
    property_address: propertyAddress,
    owner_name: decedent,
    decedent_name: decedent,
    estate_case_number: blob.match(CASE)?.[1] ?? null,
    personal_representative: pr,
    interested_persons: [],
    mailing_address: null,
    transfer_date: null,
    deed_reference: blob.match(DEED)?.[1] ?? null,
    parcel_id: null,
    tax_account_id: null,
    media_url: null,
    confidence_score: 40 + (propertyAddress ? 20 : 0) + (decedent ? 18 : 0) + (hasEstate ? 12 : 0),
    raw_payload: { title: hit.title, content: hit.content },
    title: hit.title,
    snippet: hit.content.slice(0, 400),
  };
}
