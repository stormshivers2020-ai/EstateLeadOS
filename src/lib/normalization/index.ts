import type { PropertyRecord } from "@/lib/types/leads";

const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

export function normalizeState(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  return STATE_ABBREVIATIONS[lower] ?? trimmed.toUpperCase().slice(0, 2);
}

export function normalizeCounty(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/\s+county$/i, "")
    .replace(/\s+parish$/i, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeAddress(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(st|street)\b/gi, "St")
    .replace(/\b(ave|avenue)\b/gi, "Ave")
    .replace(/\b(rd|road)\b/gi, "Rd")
    .replace(/\b(dr|drive)\b/gi, "Dr")
    .replace(/\b(ln|lane)\b/gi, "Ln")
    .replace(/\b(blvd|boulevard)\b/gi, "Blvd");
}

export function normalizeOwnerName(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      if (part.length <= 2 && part.endsWith(".")) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

export function normalizeZip(input: string | null | undefined): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 9) return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  return digits.slice(0, 5);
}

export function normalizeDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
}

export function normalizeCurrency(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") return input;
  const cleaned = input.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function normalizePropertyType(input: string | null | undefined): string | null {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  const types: Record<string, string> = {
    sfr: "Single Family", "single family": "Single Family", sfh: "Single Family",
    condo: "Condo", townhouse: "Townhouse", duplex: "Duplex", triplex: "Triplex",
    "multi-family": "Multi-Family", land: "Land", commercial: "Commercial",
  };
  return types[lower] ?? input.trim();
}

export function normalizeBoolean(input: string | boolean | null | undefined): boolean {
  if (typeof input === "boolean") return input;
  if (!input) return false;
  const lower = String(input).toLowerCase().trim();
  return ["true", "yes", "y", "1", "vacant", "delinquent"].includes(lower);
}

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return input.trim();
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

export function normalizeParcelId(input: string | null | undefined): string | null {
  if (!input) return null;
  return input.trim().replace(/\s+/g, "-");
}

export interface DuplicateKey {
  parcelId: string | null;
  propertyAddress: string;
  ownerName: string | null;
  county: string;
  state: string;
  mailingAddress: string | null;
}

export function buildDuplicateKey(record: Partial<PropertyRecord>): string {
  const parts = [
    record.parcelId ?? "",
    normalizeAddress(record.propertyAddress ?? "").toLowerCase(),
    (record.ownerName ?? "").toLowerCase(),
    normalizeCounty(record.county ?? "").toLowerCase(),
    normalizeState(record.state ?? ""),
    (record.mailingAddress ?? "").toLowerCase(),
  ];
  return parts.join("|");
}

export function detectMissingFields(record: Partial<PropertyRecord>): string[] {
  const missing: string[] = [];
  if (!record.propertyAddress) missing.push("Property address");
  if (!record.state) missing.push("State");
  if (!record.county) missing.push("County");
  if (!record.ownerName) missing.push("Owner name");
  if (!record.parcelId) missing.push("Parcel ID");
  if (!record.lastTransferDate && !record.lastSaleDate) missing.push("Transfer or sale date");
  return missing;
}

export interface RawCsvRow {
  [key: string]: string;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  propertyAddress: ["property address", "address", "property_address", "situs address", "site address"],
  street: ["street", "street address", "addr"],
  city: ["city", "municipality"],
  state: ["state", "st"],
  zip: ["zip", "zip code", "zipcode", "postal code"],
  county: ["county", "county name"],
  parcelId: ["parcel id", "parcel", "apn", "parcel number", "tax id"],
  ownerName: ["owner name", "owner", "grantee", "current owner"],
  mailingAddress: ["mailing address", "mail address", "owner mailing"],
  transferDate: ["transfer date", "deed date", "last transfer"],
  saleDate: ["sale date", "last sale date"],
  saleAmount: ["sale amount", "sale price", "last sale amount"],
  assessedValue: ["assessed value", "tax assessed value", "assessment"],
  estimatedValue: ["estimated value", "market value", "arv"],
  deedType: ["deed type", "deed"],
  mortgageDate: ["mortgage date"],
  mortgageAmount: ["mortgage amount", "loan amount"],
  taxDelinquency: ["tax delinquency", "tax delinquent", "delinquent"],
  vacancy: ["vacancy", "vacant", "vacancy signal"],
  phone: ["phone", "phone number"],
  email: ["email", "email address"],
  notes: ["notes", "comments"],
  propertyType: ["property type", "type", "land use"],
  beds: ["beds", "bedrooms"],
  baths: ["baths", "bathrooms"],
  squareFeet: ["square feet", "sqft", "sq ft", "living area"],
};

export function suggestColumnMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalizedHeaders.findIndex(
        (h) => h === alias || h.includes(alias)
      );
      if (idx >= 0 && !mappings[field]) {
        mappings[field] = headers[idx];
      }
    }
  }
  return mappings;
}

export function mapCsvRowToProperty(
  row: RawCsvRow,
  mappings: Record<string, string>
): Partial<PropertyRecord> {
  const get = (field: string) => {
    const col = mappings[field];
    return col ? row[col]?.trim() : undefined;
  };

  const street = normalizeAddress(get("street") ?? get("propertyAddress")?.split(",")[0]);
  const city = get("city") ?? "";
  const state = normalizeState(get("state"));
  const zip = normalizeZip(get("zip"));
  const propertyAddress = normalizeAddress(
    get("propertyAddress") ?? [street, city, state, zip].filter(Boolean).join(", ")
  );

  return {
    propertyAddress,
    street,
    city,
    state,
    zip,
    county: normalizeCounty(get("county")),
    parcelId: normalizeParcelId(get("parcelId")),
    ownerName: normalizeOwnerName(get("ownerName")),
    mailingAddress: normalizeAddress(get("mailingAddress")),
    propertyType: normalizePropertyType(get("propertyType")),
    beds: get("beds") ? parseInt(get("beds")!, 10) || null : null,
    baths: get("baths") ? parseFloat(get("baths")!) || null : null,
    squareFeet: get("squareFeet") ? parseInt(get("squareFeet")!, 10) || null : null,
    taxAssessedValue: normalizeCurrency(get("assessedValue")),
    estimatedMarketValue: normalizeCurrency(get("estimatedValue")),
    lastSaleDate: normalizeDate(get("saleDate")),
    lastSaleAmount: normalizeCurrency(get("saleAmount")),
    lastTransferDate: normalizeDate(get("transferDate") ?? get("saleDate")),
    deedType: get("deedType") ?? null,
    mortgageDate: normalizeDate(get("mortgageDate")),
    mortgageAmount: normalizeCurrency(get("mortgageAmount")),
    taxDelinquencyStatus: normalizeBoolean(get("taxDelinquency")),
    vacancySignal: normalizeBoolean(get("vacancy")),
    ownerOccupiedStatus: "unknown",
    mortgageStatus: get("mortgageAmount") ? "active" : "unknown",
    listedStatus: false,
    sourceConfidence: 50,
  };
}
