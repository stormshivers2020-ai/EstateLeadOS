/** Client-safe Maryland pipeline source IDs (no server-only imports) */

export const MARYLAND_STATEWIDE_SOURCE_IDS = [
  "md-sdat",
  "md-mdlandrec",
  "md-register-wills",
  "md-open-data",
] as const;

export const HARFORD_COUNTY_SOURCE_IDS = ["md-harford-gis", "md-harford-tax"] as const;

export function getActiveSourceIdsForCounty(countyName: string): string[] {
  if (countyName === "Harford") {
    return [...MARYLAND_STATEWIDE_SOURCE_IDS, ...HARFORD_COUNTY_SOURCE_IDS];
  }
  return [...MARYLAND_STATEWIDE_SOURCE_IDS];
}
