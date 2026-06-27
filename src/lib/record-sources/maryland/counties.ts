/** All 24 Maryland jurisdictions for pipeline expansion */
export const MARYLAND_COUNTIES = [
  "Allegany",
  "Anne Arundel",
  "Baltimore City",
  "Baltimore",
  "Calvert",
  "Caroline",
  "Carroll",
  "Cecil",
  "Charles",
  "Dorchester",
  "Frederick",
  "Garrett",
  "Harford",
  "Howard",
  "Kent",
  "Montgomery",
  "Prince George's",
  "Queen Anne's",
  "St. Mary's",
  "Somerset",
  "Talbot",
  "Washington",
  "Wicomico",
  "Worcester",
] as const;

export type MarylandCounty = (typeof MARYLAND_COUNTIES)[number];
