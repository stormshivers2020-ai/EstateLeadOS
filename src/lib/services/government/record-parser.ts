import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { InternetSearchHit } from "@/lib/services/lead-discovery/types";
import { classifySourceUrl } from "./source-filter";
import { getAllowedGovernmentSources } from "./source-registry";

import { extractAddress, extractRecordFields } from "./field-extractor";

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

  const fields = extractRecordFields(blob, market.state);
  const propertyAddress = fields.propertyAddress;
  const hasEstate = fields.hasEstateSignal;

  if (!propertyAddress && !hasEstate && !fields.decedentName) return null;

  const recordType = source.sourceType;
  const confidenceScore = scoreRecord(recordType, Boolean(propertyAddress), hasEstate);

  return {
    sourceName: source.sourceName,
    sourceType: source.sourceType,
    sourceUrl: hit.url,
    jurisdiction: `${market.county} County, ${market.state}`,
    recordType,
    propertyAddress,
    ownerName: fields.ownerName ?? fields.decedentName,
    transferDate: fields.transferDate,
    deedReference: fields.deedReference,
    estateCaseNumber: fields.estateCaseNumber,
    decedentName: fields.decedentName,
    personalRepresentative: fields.personalRepresentative,
    interestedPersons: [],
    mailingAddress: fields.mailingAddress,
    confidenceScore,
    rawPayload: { title: hit.title, content: hit.content, score: hit.score, parcelId: fields.parcelId },
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
