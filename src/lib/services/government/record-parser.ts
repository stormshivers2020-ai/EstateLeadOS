import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { InternetSearchHit } from "@/lib/services/lead-discovery/types";
import { classifySourceUrl } from "./source-filter";
import { getAllowedGovernmentSources } from "./source-registry";

const ADDRESS_PATTERN =
  /\d{1,6}\s+[\w\s.'#-]+(?:\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Ct|Court|Pl|Place)\b)[,\s]+[\w\s.'-]+,?\s*[A-Z]{2}\b(?:\s+\d{5}(?:-\d{4})?)?/i;

const ESTATE_CASE = /\b(?:estate|case|file)\s*(?:no\.?|#)?\s*([A-Z0-9-]{4,})/i;
const DEED_REF = /\b(?:deed|instrument|lib|book)\s*(?:no\.?|#)?\s*([A-Z0-9-]{3,})/i;
const DECEDENT = /(?:estate of|decedent|in re:?\s*(?:the\s+)?estate of)\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const PR_PATTERN = /(?:personal representative|executor|administrator)[:\s]+([A-Za-z][A-Za-z\s.'-]{1,60})/i;

function extractAddress(text: string, state: string): string | null {
  const match = text.match(ADDRESS_PATTERN);
  if (match) return match[0].replace(/\s+/g, " ").trim();
  const street = text.match(/\d{1,6}\s+[\w\s.'#-]+(?:St|Street|Ave|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way|Ct|Court)\b/i);
  return street ? `${street[0].trim()}, ${state}` : null;
}

function scoreRecord(recordType: string, hasAddress: boolean, hasEstate: boolean): number {
  let score = 40;
  if (hasAddress) score += 20;
  if (hasEstate) score += 18;
  if (/property_assessment|gis_parcel|tax_record/i.test(recordType)) score += 12;
  if (/deed|land_record/i.test(recordType)) score += 14;
  if (/probate|estate/i.test(recordType)) score += 16;
  return Math.min(92, score);
}

export function hitToGovernmentRecord(
  hit: InternetSearchHit,
  source: { sourceName: string; sourceType: string; registryId?: string },
  market: { state: string; county: string }
): GovernmentNormalizedRecord | null {
  const blob = `${hit.title}. ${hit.content}`;
  const classification = classifySourceUrl(hit.url, true);
  if (!classification.allowed) return null;

  const propertyAddress = extractAddress(blob, market.state);
  const decedentMatch = blob.match(DECEDENT);
  const prMatch = blob.match(PR_PATTERN);
  const deedMatch = blob.match(DEED_REF);
  const caseMatch = blob.match(ESTATE_CASE);
  const hasEstate = /probate|estate|decedent|executor|heir|register of wills/i.test(blob);

  if (!propertyAddress && !hasEstate && !decedentMatch) return null;

  const recordType = source.sourceType;
  const confidenceScore = scoreRecord(recordType, Boolean(propertyAddress), hasEstate);

  return {
    sourceName: source.sourceName,
    sourceType: source.sourceType,
    sourceUrl: hit.url,
    jurisdiction: `${market.county} County, ${market.state}`,
    recordType,
    propertyAddress,
    ownerName: decedentMatch?.[1]?.trim() ?? null,
    transferDate: null,
    deedReference: deedMatch?.[1] ?? null,
    estateCaseNumber: caseMatch?.[1] ?? null,
    decedentName: decedentMatch?.[1]?.trim() ?? null,
    personalRepresentative: prMatch?.[1]?.trim() ?? null,
    interestedPersons: [],
    mailingAddress: null,
    confidenceScore,
    rawPayload: { title: hit.title, content: hit.content, score: hit.score },
    title: hit.title,
    snippet: hit.content.slice(0, 400),
    registryId: source.registryId,
  };
}

export function buildConnectorQueries(
  source: { sourceName: string; baseUrl: string; sourceType: string },
  market: { state: string; county: string; city?: string }
): string[] {
  const place = market.city
    ? `${market.city} ${market.county} County ${market.state}`
    : `${market.county} County ${market.state}`;
  const domain = (() => {
    try {
      return new URL(source.baseUrl).hostname;
    } catch {
      return source.baseUrl;
    }
  })();

  const base = `site:${domain}`;
  switch (source.sourceType) {
    case "property_assessment":
      return [`${base} real property ${place} owner assessment`, `${base} SDAT ${market.county} ${market.state} property`];
    case "deed_land_record":
      return [`${base} deed transfer ${place}`, `${base} land record ${market.county} estate`];
    case "probate_estate":
      return [`${base} estate probate ${place}`, `${base} register of wills ${market.county} decedent`];
    case "gis_parcel_map":
      return [`${base} parcel map ${place}`, `${base} GIS ${market.county} property parcel`];
    case "tax_record":
      return [`${base} property tax ${place}`, `${base} ${market.county} tax assessment property`];
    default:
      return [`${base} inherited property ${place}`, `${base} estate property ${market.county}`];
  }
}

export function getConnectorsForMarket(state: string, county: string) {
  return getAllowedGovernmentSources(state, county);
}
