export const CONFIDENCE_LEVELS = ["low", "moderate", "high", "manual_review_required"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const DEAL_POTENTIAL_BANDS = [
  { min: 0, max: 24, label: "Low Deal Potential", id: "low" },
  { min: 25, max: 49, label: "Needs Review", id: "needs_review" },
  { min: 50, max: 69, label: "Moderate Potential", id: "moderate" },
  { min: 70, max: 84, label: "Strong Potential", id: "strong" },
  { min: 85, max: 100, label: "High Potential", id: "high" },
] as const;

export const BUYER_MATCH_BANDS = [
  { min: 0, max: 24, label: "Weak Match", id: "weak" },
  { min: 25, max: 49, label: "Possible Match", id: "possible" },
  { min: 50, max: 69, label: "Moderate Match", id: "moderate" },
  { min: 70, max: 84, label: "Strong Match", id: "strong" },
  { min: 85, max: 100, label: "Priority Match", id: "priority" },
] as const;

export const ASSIGNMENT_STAGES = [
  "lead_under_contract",
  "compliance_review",
  "buyer_match_started",
  "buyer_interest_confirmed",
  "buyer_disclosure_needed",
  "assignment_terms_drafted",
  "assignment_sent",
  "assignment_signed",
  "earnest_money_confirmed",
  "title_company_confirmed",
  "closing_scheduled",
  "closed",
  "fee_recorded",
  "cancelled",
] as const;

export type AssignmentStage = (typeof ASSIGNMENT_STAGES)[number];

export const PROOF_OF_FUNDS_STATUSES = [
  "unknown", "not_requested", "requested", "on_file", "expired", "needs_review", "not_provided",
] as const;

export type ProofOfFundsStatus = (typeof PROOF_OF_FUNDS_STATUSES)[number];

export const BUYER_STATUSES = [
  "active", "inactive", "needs_review", "new", "preferred", "blocked", "archived",
] as const;

export type BuyerStatus = (typeof BUYER_STATUSES)[number];

export const BUYER_SOURCES = [
  "manual_entry", "csv_import", "existing_contact", "buyer_list_upload",
  "referral", "prior_deal", "demo_data",
] as const;

export type BuyerSource = (typeof BUYER_SOURCES)[number];

export interface DealCalculatorInput {
  estimatedArv: number;
  estimatedCurrentValue?: number | null;
  taxAssessedValue?: number | null;
  estimatedRepairs: number;
  investorDiscountPercentage: number;
  holdingCosts: number;
  closingCosts: number;
  targetAssignmentSpread: number;
  riskBuffer?: number;
  buyerType?: string;
  marketDemandAdjustment?: number;
  propertyConditionAdjustment?: number;
  complianceRiskAdjustment?: number;
  buyerDemandAdjustment?: number;
  notes?: string;
}

export interface DealCalculationResult {
  investorMaxOffer: number;
  suggestedSellerOffer: number;
  offerRangeLow: number;
  offerRangeHigh: number;
  estimatedSpread: number;
  confidenceLevel: ConfidenceLevel;
  dealPotentialScore: number;
  warnings: string[];
  missingData: string[];
  assumptions: string[];
  riskNotes: string[];
}

export interface DealCalculation {
  id: string;
  organizationId: string;
  leadId: string;
  createdBy: string;
  estimatedArv: number;
  estimatedCurrentValue: number | null;
  taxAssessedValue: number | null;
  estimatedRepairs: number;
  investorDiscountPercentage: number;
  holdingCosts: number;
  closingCosts: number;
  targetAssignmentSpread: number;
  riskBuffer: number;
  buyerType: string;
  investorMaxOffer: number;
  suggestedSellerOffer: number;
  offerRangeLow: number;
  offerRangeHigh: number;
  estimatedSpread: number;
  confidenceLevel: ConfidenceLevel;
  dealPotentialScore: number;
  notes: string | null;
  assumptions: string[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DealPotentialScoreRecord {
  id: string;
  organizationId: string;
  leadId: string;
  score: number;
  scoreBand: string;
  positiveFactors: string[];
  negativeFactors: string[];
  missingData: string[];
  riskFactors: string[];
  confidenceLevel: ConfidenceLevel;
  calculatedAt: string;
  calculatedBy: string;
}

export interface Buyer {
  id: string;
  organizationId: string;
  buyerName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  preferredStates: string[];
  preferredCounties: string[];
  preferredCities: string[];
  preferredZipCodes: string[];
  propertyTypes: string[];
  maxPrice: number | null;
  minimumSpread: number | null;
  cashBuyer: boolean;
  proofOfFundsOnFile: boolean;
  proofOfFundsStatus: ProofOfFundsStatus;
  closingSpeed: string;
  buyBoxNotes: string | null;
  lastContacted: string | null;
  status: BuyerStatus;
  tags: string[];
  source: BuyerSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerImportBatch {
  id: string;
  organizationId: string;
  uploadedBy: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  buyersCreated: number;
  buyersUpdated: number;
  duplicatesFound: number;
  missingContactInfo: number;
  proofOfFundsMissing: number;
  rowsRequiringReview: number;
  errors: string[];
  createdAt: string;
}

export interface BuyerMatch {
  id: string;
  organizationId: string;
  leadId: string;
  buyerId: string;
  matchScore: number;
  matchBand: string;
  whyMatched: string[];
  missingInfo: string[];
  proofOfFundsStatus: ProofOfFundsStatus;
  lastContacted: string | null;
  suggestedNextStep: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerContactLog {
  id: string;
  organizationId: string;
  leadId: string | null;
  buyerId: string;
  userId: string;
  contactMethod: string;
  templateUsedId: string | null;
  messageSnapshot: string;
  outcome: string;
  notes: string | null;
  createdAt: string;
}

export interface Assignment {
  id: string;
  organizationId: string;
  leadId: string;
  buyerId: string | null;
  sellerName: string;
  originalPurchasePrice: number | null;
  buyerAssignmentPrice: number | null;
  estimatedAssignmentSpread: number | null;
  actualAssignmentFee: number | null;
  earnestMoney: number | null;
  titleCompany: string | null;
  closingDate: string | null;
  requiredDisclosures: string[];
  signedDocuments: string[];
  complianceStatus: string;
  attorneyTitleReviewStatus: string;
  assignmentStage: AssignmentStage;
  notes: string | null;
  assignedUserName: string | null;
  hasBlocker: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentStageChange {
  id: string;
  organizationId: string;
  assignmentId: string;
  leadId: string;
  userId: string;
  fromStage: AssignmentStage;
  toStage: AssignmentStage;
  allowed: boolean;
  blockedReason: string | null;
  createdAt: string;
}

export interface BuyerOutreachTemplate {
  id: string;
  organizationId: string | null;
  templateName: string;
  category: string;
  channel: string;
  body: string;
  variables: string[];
  safetyStatus: string;
  disclosureReminderFlag: boolean;
  assignmentRiskReminderFlag: boolean;
  reviewStatus: string;
  active: boolean;
}

export interface DealWorkflowAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  leadId: string | null;
  assignmentId: string | null;
  buyerId: string | null;
  actionType: string;
  actionDescription: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export const CALCULATOR_DISCLAIMER =
  "These numbers are estimates based on user-entered assumptions and available data. EstateLeadOS does not guarantee profit, offer acceptance, assignment success, or closing outcome.";

export const ASSIGNMENT_RISK_WARNING =
  "Assignment workflows may involve state-specific disclosure, licensing, marketing, contract, and title-company requirements. EstateLeadOS does not provide legal or brokerage advice. Confirm with a qualified professional before proceeding.";

export const FINANCIAL_ESTIMATE_DISCLAIMER =
  "Values shown are estimates or user-entered outcomes. EstateLeadOS does not guarantee profit, spread, assignment success, or closing results.";

export const BUYER_MATCH_DISCLAIMER =
  "This buyer appears to match the lead's buy-box assumptions. Confirm interest, proof of funds, and terms before proceeding.";
