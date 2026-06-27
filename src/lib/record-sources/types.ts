export type ConnectorMode = "automated" | "semi_automated" | "manual_review_only";

export type RecordSourceType =
  | "property_assessment"
  | "deed_land_record"
  | "probate_estate"
  | "gis_parcel_map"
  | "tax_record"
  | "open_data"
  | "court_record";

export interface NormalizedGovernmentRecord {
  source_name: string;
  source_type: RecordSourceType | string;
  jurisdiction_state: string;
  jurisdiction_county: string;
  source_url: string;
  record_type: string;
  property_address?: string | null;
  owner_name?: string | null;
  decedent_name?: string | null;
  estate_case_number?: string | null;
  personal_representative?: string | null;
  interested_persons?: string[];
  mailing_address?: string | null;
  transfer_date?: string | null;
  deed_reference?: string | null;
  parcel_id?: string | null;
  tax_account_id?: string | null;
  media_url?: string | null;
  confidence_score: number;
  raw_payload: Record<string, unknown>;
  title: string;
  snippet: string;
}

export interface RecordSourceConnector {
  id: string;
  sourceName: string;
  sourceType: RecordSourceType | string;
  baseUrl: string;
  jurisdictionState: string;
  jurisdictionCounty?: string | null;
  mode: ConnectorMode;
  requiresManualLogin: boolean;
  allowedForLeadCreation: boolean;
  trustLevel: "official" | "official_secondary" | "enrichment" | "rejected";
  buildQueries: (market: { state: string; county: string; city?: string }) => string[];
  parseHit?: (hit: { title: string; url: string; content: string }, market: { state: string; county: string }) => NormalizedGovernmentRecord | null;
}

export interface CountyConnectorBundle {
  stateAbbr: string;
  countyName: string;
  connectors: RecordSourceConnector[];
}
