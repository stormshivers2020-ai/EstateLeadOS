import type { UserRoleId } from "@/lib/constants/roles";
import type { PlanId } from "@/lib/constants/plans";

export const AUTOMATION_STATUSES = [
  "idle",
  "queued",
  "running",
  "paused",
  "waiting_for_approval",
  "blocked",
  "failed",
  "completed",
  "cancelled",
  "stopped",
] as const;

export type AutomationStatus = (typeof AUTOMATION_STATUSES)[number];

export const AUTOMATION_TYPES = [
  "internet_lead_discovery",
  "lead_research",
  "document_discovery",
  "compliance_review",
  "document_packet",
  "outreach_preparation",
  "deal_calculation",
  "buyer_match",
  "assignment_readiness",
  "closing_payout_readiness",
  "full_lead_to_deal",
] as const;

export type AutomationType = (typeof AUTOMATION_TYPES)[number];

export const AUTOMATION_STAGES = [
  "internet_discovery",
  "intake",
  "source_review",
  "document_discovery",
  "probate_research",
  "signal_scoring",
  "compliance_check",
  "document_packet_build",
  "outreach_preparation",
  "deal_calculation",
  "buyer_matching",
  "assignment_readiness",
  "closing_payout_readiness",
  "completion_summary",
] as const;

export type AutomationStage = (typeof AUTOMATION_STAGES)[number];

export const APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_more_info",
  "escalated",
  "not_required",
  "expired",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_TYPES = [
  "lead_discovery_approval",
  "source_approval",
  "compliance_approval",
  "document_approval",
  "attorney_review_acknowledgement",
  "outreach_approval",
  "assignment_approval",
  "buyer_approval",
  "payout_readiness_approval",
  "admin_override",
] as const;

export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const PAYOUT_READINESS_STATUSES = [
  "not_started",
  "not_ready",
  "missing_closing_confirmation",
  "missing_assignment_fee",
  "missing_buyer_seller_data",
  "missing_title_company_confirmation",
  "missing_signed_documents",
  "missing_payout_method",
  "payment_provider_not_connected",
  "ready_for_payout_review",
  "payout_approved",
  "payout_processing_placeholder",
  "payout_completed_manually",
  "payout_failed_placeholder",
] as const;

export type PayoutReadinessStatus = (typeof PAYOUT_READINESS_STATUSES)[number];

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "waiting_approval";

export interface AutomationRun {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  leadId: string | null;
  wizardId: string | null;
  automationType: AutomationType;
  currentStage: AutomationStage;
  currentStep: string;
  status: AutomationStatus;
  progress: number;
  requiredApprovalIds: string[];
  activeBlockerIds: string[];
  startedAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  completedAt: string | null;
  stoppedAt: string | null;
  errorMessage: string | null;
  auditLogRef: string;
  discoveryMarket?: { state: string; county: string; city?: string };
  discoverySearchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationStep {
  id: string;
  automationRunId: string;
  stepName: string;
  stepOrder: number;
  stage: AutomationStage;
  status: StepStatus;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  requiresApproval: boolean;
  approvalId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationApproval {
  id: string;
  automationRunId: string;
  organizationId: string;
  leadId: string | null;
  approvalType: ApprovalType;
  approvalTitle: string;
  approvalDescription: string;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
  riskLevel: "low" | "moderate" | "elevated" | "high" | "restricted";
  requiredRole: UserRoleId | "user";
  status: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLog {
  id: string;
  automationRunId: string;
  organizationId: string;
  leadId: string | null;
  step: string;
  action: string;
  status: "info" | "success" | "warning" | "error";
  message: string;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
  riskLevel: string | null;
  errorDetails: string | null;
  userActionRequired: boolean;
  createdAt: string;
}

export interface PayoutReadiness {
  id: string;
  organizationId: string;
  leadId: string;
  assignmentId: string | null;
  actualAssignmentFee: number | null;
  closingDate: string | null;
  titleCompany: string | null;
  buyerId: string | null;
  sellerName: string | null;
  signedDocumentsStatus: string;
  complianceStatus: string;
  documentPacketStatus: string;
  paymentProviderStatus: string;
  bankPayoutMethodPlaceholder: string | null;
  payoutApprovalStatus: ApprovalStatus;
  payoutReadinessStatus: PayoutReadinessStatus;
  payoutNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationState {
  runs: AutomationRun[];
  steps: AutomationStep[];
  approvals: AutomationApproval[];
  logs: AutomationLog[];
  payoutReadiness: PayoutReadiness[];
  activeRunId: string | null;
}

export const AUTOMATION_TYPE_LABELS: Record<AutomationType, string> = {
  internet_lead_discovery: "Internet Lead Discovery",
  lead_research: "Lead Research Automation",
  document_discovery: "Document Discovery Automation",
  compliance_review: "Compliance Review Automation",
  document_packet: "Document Packet Automation",
  outreach_preparation: "Outreach Preparation Automation",
  deal_calculation: "Deal Calculation Automation",
  buyer_match: "Buyer Match Automation",
  assignment_readiness: "Assignment Readiness Automation",
  closing_payout_readiness: "Closing / Payout Readiness Automation",
  full_lead_to_deal: "Full Lead-to-Deal Workflow Automation",
};

export const STAGE_STEPS: Record<AutomationStage, string[]> = {
  internet_discovery: ["search_internet_leads", "await_operator_lead_approval"],
  intake: ["confirm_lead"],
  source_review: ["check_market_support", "check_source_permissions", "check_source_health"],
  document_discovery: ["identify_required_documents", "check_source_records", "flag_missing_documents"],
  probate_research: ["update_owner_history", "update_transfer_signals", "flag_manual_verification"],
  signal_scoring: ["recalculate_estate_score", "recalculate_confidence", "recalculate_deal_potential"],
  compliance_check: ["run_compliance_engine", "check_acknowledgements", "create_blockers_if_needed"],
  document_packet_build: ["generate_packet", "checklist_review", "attorney_review_flags"],
  outreach_preparation: ["check_dnc_consent", "run_outreach_safety_guard", "prepare_templates"],
  deal_calculation: ["gather_assumptions", "run_calculator", "add_disclaimer"],
  buyer_matching: ["match_buyers", "check_proof_of_funds", "suggest_best_match"],
  assignment_readiness: ["check_disclosures", "check_title_status", "check_packet_readiness"],
  closing_payout_readiness: ["check_closing_status", "check_fee_recorded", "check_payout_method"],
  completion_summary: ["generate_summary", "log_audit", "set_next_action"],
};

export const FULL_WORKFLOW_STAGES: AutomationStage[] = [
  "internet_discovery",
  "intake",
  "source_review",
  "document_discovery",
  "probate_research",
  "signal_scoring",
  "compliance_check",
  "document_packet_build",
  "outreach_preparation",
  "deal_calculation",
  "buyer_matching",
  "assignment_readiness",
  "closing_payout_readiness",
  "completion_summary",
];

export const TYPE_STAGE_MAP: Partial<Record<AutomationType, AutomationStage[]>> = {
  internet_lead_discovery: ["internet_discovery", "completion_summary"],
  lead_research: ["internet_discovery", "intake", "source_review", "document_discovery", "probate_research", "signal_scoring", "completion_summary"],
  document_discovery: ["intake", "source_review", "document_discovery", "completion_summary"],
  compliance_review: ["intake", "compliance_check", "completion_summary"],
  document_packet: ["intake", "document_packet_build", "completion_summary"],
  outreach_preparation: ["intake", "compliance_check", "outreach_preparation", "completion_summary"],
  deal_calculation: ["intake", "deal_calculation", "completion_summary"],
  buyer_match: ["intake", "buyer_matching", "completion_summary"],
  assignment_readiness: ["intake", "assignment_readiness", "completion_summary"],
  closing_payout_readiness: ["intake", "closing_payout_readiness", "completion_summary"],
  full_lead_to_deal: FULL_WORKFLOW_STAGES,
};

export const AUTOMATION_PLAN_ACCESS: Record<AutomationType, PlanId[]> = {
  internet_lead_discovery: ["pro", "team", "market_license", "enterprise"],
  lead_research: ["pro", "team", "market_license", "enterprise"],
  document_discovery: ["pro", "team", "market_license", "enterprise"],
  compliance_review: ["pro", "team", "market_license", "enterprise"],
  document_packet: ["pro", "team", "market_license", "enterprise"],
  outreach_preparation: ["pro", "team", "market_license", "enterprise"],
  deal_calculation: ["pro", "team", "market_license", "enterprise"],
  buyer_match: ["team", "market_license", "enterprise"],
  assignment_readiness: ["team", "market_license", "enterprise"],
  closing_payout_readiness: ["team", "market_license", "enterprise"],
  full_lead_to_deal: ["team", "market_license", "enterprise"],
};
