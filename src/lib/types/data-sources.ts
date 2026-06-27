export const SOURCE_ACCESS_STATUSES = [
  "approved_api",
  "approved_manual",
  "approved_csv_import",
  "paid_provider",
  "requires_review",
  "blocked",
  "unknown",
  "research_only",
  "not_available",
] as const;

export type SourceAccessStatus = (typeof SOURCE_ACCESS_STATUSES)[number];

export const SOURCE_TYPES = [
  "tax_assessor",
  "recorder_deed",
  "probate_court",
  "register_of_wills",
  "property_data_api",
  "vacancy_data",
  "tax_delinquency",
  "mortgage_lien",
  "mls_listing_feed",
  "public_notice",
  "obituary_estate_notice",
  "skip_trace_provider",
  "csv_upload",
  "manual_research",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const ACCESS_METHODS = [
  "api",
  "manual",
  "import",
  "approved",
  "blocked",
  "paid",
] as const;

export type AccessMethod = (typeof ACCESS_METHODS)[number];

export const CONNECTOR_RESULT_STATUSES = [
  "success",
  "partial_success",
  "failed",
  "blocked_by_permission_guard",
  "credentials_missing",
  "terms_review_required",
  "source_unavailable",
  "county_unsupported",
  "no_records_found",
  "rate_limited",
  "manual_review_required",
] as const;

export type ConnectorResultStatus = (typeof CONNECTOR_RESULT_STATUSES)[number];

export interface DataSource {
  id: string;
  name: string;
  sourceType: SourceType;
  state: string | null;
  county: string | null;
  accessMethod: AccessMethod;
  permissionStatus: SourceAccessStatus;
  termsStatus: string;
  sourceUrl: string | null;
  reliabilityScore: number;
  freshnessScore: number;
  lastCheckedAt: string | null;
  lastSyncAt: string | null;
  lastSyncResult: ConnectorResultStatus | null;
  failureReason: string | null;
  adminApprovalStatus: string;
  legalAccessWarning: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataConnector {
  id: string;
  dataSourceId: string;
  connectorName: string;
  connectorType: SourceType;
  state: string | null;
  county: string | null;
  accessMethod: AccessMethod;
  credentialsRequired: boolean;
  credentialsConfigured: boolean;
  executionMode: string;
  status: string;
  lastRunAt: string | null;
  lastResult: ConnectorResultStatus | null;
  failureReason: string | null;
  reliabilityScore: number;
  freshnessScore: number;
  monthlyCost: number | null;
  notes: string | null;
  adminApprovalStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorLog {
  id: string;
  connectorId: string;
  organizationId: string | null;
  status: ConnectorResultStatus;
  message: string;
  startedAt: string;
  finishedAt: string | null;
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  errorDetails: string | null;
  createdAt: string;
}

export interface LeadScoringRule {
  id: string;
  ruleName: string;
  signalCategory: string;
  signalName: string;
  weight: number;
  active: boolean;
  requiredSourceConfidence: number;
  minimumDataFreshness: number;
  manualReviewRequired: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportedState {
  id: string;
  name: string;
  abbreviation: string;
  supportedStatus: "fully_supported" | "partially_supported" | "beta" | "research_only" | "unavailable";
  countyCount: number;
}

export interface SupportedCounty {
  id: string;
  stateAbbreviation: string;
  name: string;
  supportedStatus: "api_supported" | "manual_upload_only" | "unavailable" | "beta";
}
