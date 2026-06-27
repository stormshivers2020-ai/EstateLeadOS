export const STATE_SUPPORT_STATUSES = [
  "fully_supported",
  "partially_supported",
  "research_only",
  "manual_upload_only",
  "coming_soon",
  "unavailable",
  "restricted",
  "attorney_review_required",
] as const;

export type StateSupportStatus = (typeof STATE_SUPPORT_STATUSES)[number];

export const COUNTY_SUPPORT_STATUSES = [
  "api_supported",
  "approved_manual",
  "csv_import_supported",
  "manual_upload_only",
  "research_only",
  "coming_soon",
  "unavailable",
  "blocked",
  "unknown",
] as const;

export type CountySupportStatus = (typeof COUNTY_SUPPORT_STATUSES)[number];

export const COMPLIANCE_REVIEW_STATUSES = [
  "not_reviewed",
  "in_review",
  "reviewed_internally",
  "attorney_reviewed",
  "needs_update",
  "expired_review",
  "research_only",
] as const;

export type ComplianceReviewStatus = (typeof COMPLIANCE_REVIEW_STATUSES)[number];

export const RISK_RATINGS = [
  "low",
  "moderate",
  "elevated",
  "high",
  "restricted",
  "attorney_review_required",
] as const;

export type RiskRating = (typeof RISK_RATINGS)[number];

export const DATA_AVAILABILITY_RATINGS = [
  "strong",
  "moderate",
  "limited",
  "manual_only",
  "unknown",
  "unavailable",
] as const;

export type DataAvailabilityRating = (typeof DATA_AVAILABILITY_RATINGS)[number];

export const DEAL_TYPES = [
  "direct_purchase",
  "assignment_of_contract",
  "double_closing",
  "referral_to_licensed_agent",
  "hold_for_rental",
  "buyer_network_disposition",
  "needs_attorney_review",
] as const;

export type DealType = (typeof DEAL_TYPES)[number];

export const ACQUISITION_STRATEGIES = [
  "research_only",
  "seller_outreach_preparation",
  "direct_acquisition",
  "contract_assignment",
  "buyer_disposition",
  "title_review",
  "attorney_review",
  "hold_rental_review",
  "referral_workflow",
] as const;

export type AcquisitionStrategy = (typeof ACQUISITION_STRATEGIES)[number];

export const CHECKLIST_ITEM_STATUSES = [
  "not_started",
  "in_progress",
  "complete",
  "not_required",
  "blocked",
  "needs_review",
] as const;

export type ChecklistItemStatus = (typeof CHECKLIST_ITEM_STATUSES)[number];

export const EQUIPMENT_STATUSES = [
  "not_started",
  "complete",
  "not_required",
  "recommended",
  "needs_review",
  "attorney_review_recommended",
  "blocked",
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  "not_started",
  "generated",
  "uploaded",
  "sent",
  "signed",
  "reviewed",
  "needs_attorney_review",
  "expired",
  "not_required",
  "unknown",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  "seller_documents",
  "buyer_assignee_documents",
  "title_company_documents",
  "internal_worksheets",
  "compliance_documents",
  "source_records",
  "audit_documents",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const WORKFLOW_STAGES = [
  "new_lead",
  "needs_research",
  "contact_ready",
  "under_contract",
  "buyer_matched",
  "assignment_sent",
  "closing_scheduled",
  "closed_won",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export const BLOCKER_SEVERITIES = [
  "info",
  "warning",
  "elevated",
  "blocking",
  "restricted",
] as const;

export type BlockerSeverity = (typeof BLOCKER_SEVERITIES)[number];

export const BLOCKER_STATUSES = [
  "active",
  "resolved",
  "acknowledged",
  "not_required",
  "overridden_by_admin",
  "attorney_review_acknowledged",
] as const;

export type BlockerStatus = (typeof BLOCKER_STATUSES)[number];

export const ACKNOWLEDGEMENT_TYPES = [
  "general_compliance",
  "attorney_review",
  "assignment_risk",
  "outreach_risk",
  "source_risk",
  "state_risk",
  "brokerage_interest",
  "recording_consent",
] as const;

export type AcknowledgementType = (typeof ACKNOWLEDGEMENT_TYPES)[number];

export interface StateProfile {
  id: string;
  stateName: string;
  stateAbbreviation: string;
  supportedStatus: StateSupportStatus;
  complianceReviewStatus: ComplianceReviewStatus;
  lastReviewedAt: string | null;
  legalSourceLinks: { label: string; url: string }[];
  attorneyReviewStatus: string;
  wholesalingDisclosureNotes: string;
  assignmentContractNotes: string;
  marketingContractInterestWarning: string;
  licensingRiskLevel: RiskRating;
  sellerDisclosureChecklist: string[];
  buyerAssigneeDisclosureChecklist: string[];
  requiredFormsChecklist: string[];
  recommendedProfessionalContacts: string[];
  titleCompanyNotes: string;
  recordingOfficeNotes: string;
  probateCourtAccessNotes: string;
  countySourceCoverage: string;
  dataAvailabilityRating: DataAvailabilityRating;
  riskRating: RiskRating;
  userWarnings: string[];
  outreachCaution: string;
  recordingConsentReminder: string | null;
  callTextRestrictions: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountyProfile {
  id: string;
  stateProfileId: string;
  stateAbbreviation: string;
  countyName: string;
  supportedStatus: CountySupportStatus;
  dataSourceCoverage: string;
  recorderAccessStatus: string;
  taxAssessorAccessStatus: string;
  probateCourtAccessStatus: string;
  registerOfWillsAccessStatus: string | null;
  publicNoticeAccessStatus: string;
  manualUploadAvailability: boolean;
  dataReliabilityScore: number;
  dataFreshnessScore: number;
  countyRiskRating: RiskRating;
  countyNotes: string;
  sourceLinks: { label: string; url: string }[];
  lastReviewedAt: string | null;
  adminApprovalStatus: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentChecklistItem {
  id: string;
  itemName: string;
  description: string;
  requirementLevel: "required" | "recommended" | "not_required";
  stateSpecific: boolean;
  dealTypeSpecific: DealType[];
  status: EquipmentStatus;
  notes: string | null;
  blockingStatus: boolean;
  acknowledgementRequired: boolean;
  lastUpdatedAt: string;
}

export interface DocumentChecklistItem {
  id: string;
  documentName: string;
  documentCategory: DocumentCategory;
  requirementLevel: "required" | "recommended" | "not_required";
  requiredByState: boolean;
  requiredByDealType: DealType[];
  requiredByWorkflowStage: WorkflowStage[];
  attorneyReviewFlag: boolean;
  signatureNeededFlag: boolean;
  uploadAllowed: boolean;
  generateAllowed: boolean;
  currentStatus: DocumentStatus;
  blockingStatus: boolean;
  notes: string | null;
  lastUpdatedAt: string;
}

export interface GettingStartedItem {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  blocking: boolean;
}

export interface StateDealKit {
  id: string;
  stateProfileId: string;
  countyProfileId: string | null;
  stateAbbreviation: string;
  countyName: string | null;
  dealType: DealType;
  userRole: string;
  acquisitionStrategy: AcquisitionStrategy;
  riskLevel: RiskRating;
  supportStatus: StateSupportStatus;
  gettingStarted: GettingStartedItem[];
  equipmentChecklist: EquipmentChecklistItem[];
  documentChecklist: DocumentChecklistItem[];
  outreachRules: string[];
  contractWorkflow: string[];
  disclosureWorkflow: string[];
  titleCompanyWorkflow: string[];
  assignmentWorkflow: string[];
  closingWorkflow: string[];
  riskWarnings: string[];
  attorneyReviewReminder: string;
  sourceLinks: { label: string; url: string }[];
  auditTrailRequirements: string[];
  warnings: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRule {
  id: string;
  stateProfileId: string;
  countyProfileId: string | null;
  ruleName: string;
  ruleCategory: string;
  dealType: DealType | null;
  acquisitionStrategy: AcquisitionStrategy | null;
  triggerCondition: string;
  riskLevel: RiskRating;
  requiredAction: string;
  blockerRule: boolean;
  acknowledgementRequired: boolean;
  attorneyReviewRecommended: boolean;
  active: boolean;
  notes: string | null;
}

export interface WorkflowBlocker {
  id: string;
  leadId: string;
  stateProfileId: string;
  countyProfileId: string | null;
  workflowStage: WorkflowStage;
  blockerType: string;
  blockerMessage: string;
  requiredAction: string;
  severity: BlockerSeverity;
  status: BlockerStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface ComplianceAcknowledgement {
  id: string;
  userId: string;
  organizationId: string;
  leadId: string | null;
  stateProfileId: string;
  countyProfileId: string | null;
  acknowledgementType: AcknowledgementType;
  acknowledgementText: string;
  relatedRiskLevel: RiskRating;
  relatedWorkflowStage: WorkflowStage | null;
  timestamp: string;
  devicePlaceholder: string;
  version: string;
  active: boolean;
}

export interface ComplianceCheckResult {
  id: string;
  leadId: string | null;
  organizationId: string;
  stateProfileId: string;
  countyProfileId: string | null;
  dealType: DealType;
  acquisitionStrategy: AcquisitionStrategy;
  riskLevel: RiskRating;
  requiredActions: string[];
  requiredAcknowledgements: AcknowledgementType[];
  activeBlockers: WorkflowBlocker[];
  allowedStages: WorkflowStage[];
  blockedStages: WorkflowStage[];
  explanation: string;
  answers: ComplianceRuleAnswers;
  checkedAt: string;
  checkedBy: string;
}

export interface ComplianceRuleAnswers {
  wholesalingDisclosureRequired: boolean | "unknown";
  sellerDisclosureRequired: boolean | "unknown";
  buyerAssigneeDisclosureRequired: boolean | "unknown";
  assignmentLicenseRisk: boolean | "unknown";
  marketPropertyOrContractInterest: "contract_interest_only" | "unknown" | "review_required";
  attorneyReviewRecommended: boolean;
  callTextRestrictions: boolean | "unknown";
  recordingConsentConcerns: boolean | "unknown";
  countyProbateAccessLimits: boolean | "unknown";
  stateSupportLevel: StateSupportStatus;
  countySupportLevel: CountySupportStatus | null;
  sourceDocumentsAttached: boolean;
  documentChecklistComplete: boolean;
  equipmentChecklistComplete: boolean;
  acknowledgementsComplete: boolean;
  ownerIdentityVerified: boolean;
  unknownSourceTerms: boolean;
  canProgressToStage: boolean;
}

export interface ComplianceAuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  leadId: string | null;
  actionType: string;
  actionDescription: string;
  previousValue: string | null;
  newValue: string | null;
  riskLevel: RiskRating | null;
  timestamp: string;
}

export interface LeadComplianceContext {
  leadId: string;
  stateAbbreviation: string | null;
  countyName: string | null;
  dealType: DealType | null;
  acquisitionStrategy: AcquisitionStrategy | null;
  complianceRiskScore: number;
  complianceRiskLevel: RiskRating;
  ownerIdentityVerified: boolean;
  sourceDocumentsAttached: boolean;
  communicationLogActive: boolean;
  equipmentProgress: number;
  documentProgress: number;
  acknowledgements: ComplianceAcknowledgement[];
  blockers: WorkflowBlocker[];
  lastComplianceCheck: ComplianceCheckResult | null;
}
