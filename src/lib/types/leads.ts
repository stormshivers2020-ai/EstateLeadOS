import type { SourceAccessStatus, SourceType } from "./data-sources";

export const LEAD_TYPES = [
  "possible_probate_lead",
  "confirmed_probate_lead",
  "possible_inherited_property",
  "estate_transfer_lead",
  "trust_transfer_lead",
  "family_transfer_lead",
  "absentee_heir_lead",
  "tax_distress_estate_lead",
  "vacant_estate_property",
  "listed_inherited_property",
  "low_confidence_lead",
  "needs_manual_review",
] as const;

export type LeadTypeId = (typeof LEAD_TYPES)[number];

export const SCORE_BANDS = [
  { min: 0, max: 24, label: "Low Confidence Lead", id: "low" },
  { min: 25, max: 49, label: "Needs Manual Review", id: "review" },
  { min: 50, max: 69, label: "Possible Estate Lead", id: "possible" },
  { min: 70, max: 84, label: "Strong Estate Lead", id: "strong" },
  { min: 85, max: 100, label: "High Confidence Estate Lead", id: "high" },
] as const;

export type ScoreBandId = (typeof SCORE_BANDS)[number]["id"];

export const SIGNAL_CATEGORIES = [
  "probate",
  "inheritance",
  "transfer",
  "distress",
  "market",
  "data_quality",
] as const;

export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export const PIPELINE_STATUSES = [
  "new_lead",
  "needs_research",
  "researching",
  "contact_ready",
  "manual_review",
  "archived",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const LEAD_ORIGINS = [
  "auto_discovered",
  "csv_imported",
  "manually_added",
  "demo",
] as const;

export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export interface PropertyRecord {
  id: string;
  propertyAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelId: string | null;
  ownerName: string | null;
  possibleHeirName: string | null;
  mailingAddress: string | null;
  ownerOccupiedStatus: "yes" | "no" | "unknown";
  propertyType: string | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  lotSize: string | null;
  yearBuilt: number | null;
  taxAssessedValue: number | null;
  estimatedMarketValue: number | null;
  lastSaleDate: string | null;
  lastSaleAmount: number | null;
  lastTransferDate: string | null;
  transferType: string | null;
  deedType: string | null;
  mortgageStatus: string | null;
  mortgageAmount: number | null;
  mortgageDate: string | null;
  taxDelinquencyStatus: boolean;
  vacancySignal: boolean;
  listedStatus: boolean;
  sourceConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSignal {
  id: string;
  estateLeadId: string;
  signalName: string;
  signalCategory: SignalCategory;
  confidenceLevel: number;
  sourceRecordId: string | null;
  sourceUrl: string | null;
  explanation: string;
  weight: number;
  createdAt: string;
}

export interface SourceRecord {
  id: string;
  propertyRecordId: string;
  dataSourceId: string;
  sourceName: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  retrievedAt: string;
  reliabilityScore: number;
  freshnessScore: number;
  permissionStatus: SourceAccessStatus;
  fieldsProvided: string[];
  notes: string | null;
  createdAt: string;
}

export interface ScoreExplanation {
  totalScore: number;
  scoreBand: ScoreBandId;
  scoreBandLabel: string;
  positiveFactors: string[];
  negativeFactors: string[];
  missingData: string[];
  manualVerificationNeeded: string[];
  sourceConfidence: number;
  lastScoredAt: string;
}

export interface EstateLead {
  id: string;
  propertyRecordId: string;
  organizationId: string;
  property: PropertyRecord;
  primaryLeadType: LeadTypeId;
  secondaryLeadTypes: LeadTypeId[];
  tags: string[];
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  dataConfidenceScore: number;
  scoreBand: ScoreBandId;
  scoreExplanation: ScoreExplanation;
  signals: LeadSignal[];
  sourceRecords: SourceRecord[];
  status: PipelineStatus;
  assignedUserId: string | null;
  assignedUserName: string | null;
  nextAction: string;
  sourceType: string;
  origin: LeadOrigin;
  importBatchId: string | null;
  autoDiscovered: boolean;
  demoRecord: boolean;
  manualReviewRequired: boolean;
  archived: boolean;
  doNotContact: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  organizationId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  sourceType: SourceType;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  leadsCreated: number;
  leadsUpdated: number;
  manualReviewRows: number;
  averageEstateLeadScore: number;
  warnings: string[];
  errors: string[];
  createdAt: string;
}

export interface ImportRowIssue {
  id: string;
  importBatchId: string;
  rowNumber: number;
  issueType: string;
  issueMessage: string;
  severity: "error" | "warning" | "info";
}

export interface MarketSearchFilters {
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  leadType?: LeadTypeId;
  estateScoreMin?: number;
  estateScoreMax?: number;
  dataConfidenceMin?: number;
  estimatedEquityMin?: number;
  propertyType?: string;
  ownerOccupied?: "yes" | "no" | "unknown";
  outOfStateOwner?: boolean;
  taxDelinquent?: boolean;
  vacant?: boolean;
  transferDateAfter?: string;
  lastSaleAfter?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  repairRisk?: string;
  listed?: boolean;
  complianceRiskMax?: number;
  sourceReliabilityMin?: number;
  sourceFreshnessMin?: number;
  dataSource?: string;
  manualReviewNeeded?: boolean;
  assignedUser?: string;
  pipelineStatus?: PipelineStatus;
  origin?: LeadOrigin;
  createdAfter?: string;
  updatedAfter?: string;
  search?: string;
}

export interface SavedMarketFilter {
  id: string;
  organizationId: string;
  userId: string;
  filterName: string;
  filterConfig: MarketSearchFilters;
  createdAt: string;
  updatedAt: string;
}
