import type { RecordSourceConnector } from "../types";

export function createStatewideConnector(
  partial: Omit<RecordSourceConnector, "buildQueries"> & {
    queryTemplates: (place: string, county: string, state: string) => string[];
  }
): RecordSourceConnector {
  return {
    ...partial,
    buildQueries: (market) =>
      partial.queryTemplates(
        market.city ? `${market.city} ${market.county} County ${market.state}` : `${market.county} County ${market.state}`,
        market.county,
        market.state
      ),
  };
}

export const SDAT_CONNECTOR = createStatewideConnector({
  id: "md-sdat",
  sourceName: "Maryland SDAT Real Property Search",
  sourceType: "property_assessment",
  baseUrl: "https://sdat.dat.maryland.gov/",
  jurisdictionState: "MD",
  jurisdictionCounty: null,
  mode: "semi_automated",
  requiresManualLogin: false,
  allowedForLeadCreation: true,
  trustLevel: "official",
  queryTemplates: (place, county, state) => [
    `site:sdat.dat.maryland.gov real property ${place}`,
    `site:sdat.dat.maryland.gov ${county} ${state} assessment owner`,
  ],
});

export const MDLANDREC_CONNECTOR = createStatewideConnector({
  id: "md-mdlandrec",
  sourceName: "Maryland Land Records (MDLandRec)",
  sourceType: "deed_land_record",
  baseUrl: "https://mdlandrec.net/",
  jurisdictionState: "MD",
  jurisdictionCounty: null,
  mode: "manual_review_only",
  requiresManualLogin: true,
  allowedForLeadCreation: true,
  trustLevel: "official",
  queryTemplates: (place) => [
    `site:mdlandrec.net deed transfer ${place}`,
    `site:mdlandrec.net estate property deed`,
  ],
});

export const REGISTER_OF_WILLS_CONNECTOR = createStatewideConnector({
  id: "md-register-wills",
  sourceName: "Maryland Register of Wills Estate Search",
  sourceType: "probate_estate",
  baseUrl: "https://registers.maryland.gov/",
  jurisdictionState: "MD",
  jurisdictionCounty: null,
  mode: "semi_automated",
  requiresManualLogin: false,
  allowedForLeadCreation: true,
  trustLevel: "official",
  queryTemplates: (place, county) => [
    `site:registers.maryland.gov estate probate ${place}`,
    `site:registers.maryland.gov ${county} decedent estate case`,
  ],
});

export const MD_OPEN_DATA_CONNECTOR = createStatewideConnector({
  id: "md-open-data",
  sourceName: "Maryland Open Data Portal",
  sourceType: "open_data",
  baseUrl: "https://data.maryland.gov/",
  jurisdictionState: "MD",
  jurisdictionCounty: null,
  mode: "semi_automated",
  requiresManualLogin: false,
  allowedForLeadCreation: true,
  trustLevel: "official_secondary",
  queryTemplates: (place) => [`site:data.maryland.gov property ${place}`],
});
