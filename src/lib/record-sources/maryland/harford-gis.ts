import { createStatewideConnector } from "./sdat";
import { fetchHarfordParcels } from "./harford-arcgis";
import type { RecordSourceConnector } from "../types";

const baseHarfordGis = createStatewideConnector({
  id: "md-harford-gis",
  sourceName: "Harford County GIS Parcel Map",
  sourceType: "gis_parcel_map",
  baseUrl: "https://gis.harfordcountymd.gov/",
  jurisdictionState: "MD",
  jurisdictionCounty: "Harford",
  mode: "semi_automated",
  requiresManualLogin: false,
  allowedForLeadCreation: true,
  trustLevel: "official",
  queryTemplates: (place) => [
    `site:gis.harfordcountymd.gov parcel ${place}`,
    `site:harfordcountymd.gov GIS property map`,
  ],
});

export const HARFORD_GIS_CONNECTOR: RecordSourceConnector = {
  ...baseHarfordGis,
  fetchLiveRecords: (market) =>
    fetchHarfordParcels({ county: market.county, state: market.state, limit: market.limit ?? 6 }),
};

export const HARFORD_TAX_CONNECTOR = createStatewideConnector({
  id: "md-harford-tax",
  sourceName: "Harford County Treasury / Property Tax",
  sourceType: "tax_record",
  baseUrl: "https://www.harfordcountymd.gov/",
  jurisdictionState: "MD",
  jurisdictionCounty: "Harford",
  mode: "semi_automated",
  requiresManualLogin: false,
  allowedForLeadCreation: true,
  trustLevel: "official_secondary",
  queryTemplates: (place) => [`site:harfordcountymd.gov property tax ${place}`],
});
