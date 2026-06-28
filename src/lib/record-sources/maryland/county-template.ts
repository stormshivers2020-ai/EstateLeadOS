import type { CountyConnectorBundle, RecordSourceConnector } from "../types";
import {
  SDAT_CONNECTOR,
  MDLANDREC_CONNECTOR,
  REGISTER_OF_WILLS_CONNECTOR,
  MD_OPEN_DATA_CONNECTOR,
} from "./sdat";
import { HARFORD_GIS_CONNECTOR, HARFORD_TAX_CONNECTOR } from "./harford-gis";
import { MARYLAND_COUNTIES } from "./counties";
import { getActiveSourceIdsForCounty } from "@/lib/constants/maryland-pipeline-sources";

export { getActiveSourceIdsForCounty };

const STATEWIDE: RecordSourceConnector[] = [
  SDAT_CONNECTOR,
  MDLANDREC_CONNECTOR,
  REGISTER_OF_WILLS_CONNECTOR,
  MD_OPEN_DATA_CONNECTOR,
];

const COUNTY_OVERRIDES: Partial<Record<string, RecordSourceConnector[]>> = {
  Harford: [HARFORD_GIS_CONNECTOR, HARFORD_TAX_CONNECTOR],
};

export function buildCountyConnectorBundle(countyName: string): CountyConnectorBundle {
  const countySpecific = COUNTY_OVERRIDES[countyName] ?? [];
  return {
    stateAbbr: "MD",
    countyName,
    connectors: [...STATEWIDE, ...countySpecific],
  };
}

export function getMarylandCountyBundles(): CountyConnectorBundle[] {
  return MARYLAND_COUNTIES.map((county) => buildCountyConnectorBundle(county));
}

export function getConnectorsForCounty(stateAbbr: string, countyName: string): RecordSourceConnector[] {
  if (stateAbbr !== "MD") return [];
  return buildCountyConnectorBundle(countyName).connectors.filter(
    (c) => c.allowedForLeadCreation && c.trustLevel !== "rejected"
  );
}
