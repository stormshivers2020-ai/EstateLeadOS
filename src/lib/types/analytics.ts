export const ANALYTICS_DISCLAIMER =
  "EstateLeadOS provides public-record research assistance, workflow tools, packet organization, evidence tracking, estimated financial modeling, and operational analytics. EstateLeadOS does not provide legal, tax, brokerage, financial, accounting, or investment advice. Estimated values, projected assignment fees, accrued amounts, and pipeline values are not guaranteed. Users are responsible for confirming all legal, tax, title, assignment, accounting, payout, and banking requirements with qualified professionals.";

export const ACCRUED_MONEY_WARNING =
  "Accrued money is not received money. Record funds as received only after payment is confirmed.";

export const PAYOUT_WARNING =
  "EstateLeadOS tracks payout readiness and recorded outcomes. Actual funds movement requires external payment, title-company, or banking confirmation.";

export type MoneyLabel =
  | "estimated"
  | "projected"
  | "accrued"
  | "pending"
  | "received"
  | "lost"
  | "user_entered"
  | "system_calculated";

export type FinancialStatus =
  | "no_financial_data"
  | "estimate_started"
  | "projected"
  | "assignment_fee_target_set"
  | "accrued"
  | "pending_payout"
  | "received"
  | "lost"
  | "written_off"
  | "archived";

export type AccruedPayoutStatus =
  | "not_accrued"
  | "potential_accrual"
  | "accrued_pending_attorney_review"
  | "accrued_pending_buyer_confirmation"
  | "accrued_pending_closing"
  | "accrued_pending_payout"
  | "accrued_disputed"
  | "accrued_written_off"
  | "received"
  | "rejected";

export type ExpenseCategory =
  | "government_record_fees"
  | "document_fees"
  | "attorney_review_fees"
  | "title_company_fees"
  | "mailing_costs"
  | "enrichment_costs"
  | "data_provider_costs"
  | "email_provider_costs"
  | "software_subscription"
  | "travel_field_research"
  | "printing_costs"
  | "marketing_costs"
  | "admin_costs"
  | "other";

export type ExpensePaymentStatus =
  | "estimated"
  | "planned"
  | "paid"
  | "reimbursed"
  | "cancelled"
  | "disputed";

export type ProcessStepStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "blocked"
  | "needs_manual_review"
  | "needs_attorney_review"
  | "ready_to_print"
  | "ready_to_upload"
  | "ready_for_archive"
  | "ready_for_distribution"
  | "archived"
  | "rejected";

export interface DealFinancials {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  assignmentId?: string | null;
  estimatedArv?: number | null;
  estimatedRepairs?: number | null;
  investorMaxOffer?: number | null;
  suggestedSellerOffer?: number | null;
  targetAssignmentFee?: number | null;
  minimumAcceptableSpread?: number | null;
  estimatedSpread?: number | null;
  agreedAssignmentFee?: number | null;
  accruedAmount?: number | null;
  pendingPayoutAmount?: number | null;
  receivedAmount?: number | null;
  expensesTotal?: number | null;
  projectedNetProfit?: number | null;
  actualNetProfit?: number | null;
  financialStatus: FinancialStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  organizationId: string;
  leadId?: string | null;
  packetId?: string | null;
  category: ExpenseCategory;
  vendor?: string | null;
  amount: number;
  expenseDate: string;
  paymentStatus: ExpensePaymentStatus;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccruedMoneyRecord {
  id: string;
  organizationId: string;
  leadId: string;
  assignmentId?: string | null;
  targetAssignmentFee?: number | null;
  agreedAssignmentFee?: number | null;
  accruedAmount: number;
  accruedDate?: string | null;
  expectedPayoutDate?: string | null;
  payoutMethod?: string | null;
  payoutStatus: AccruedPayoutStatus;
  buyerName?: string | null;
  titleCompany?: string | null;
  attorneyReviewStatus?: string | null;
  closingStatus?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStepStatusRecord {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  stepNumber: number;
  stepName: string;
  status: ProcessStepStatus;
  nextAction?: string | null;
  blockerCount: number;
  blockerReason?: string | null;
  requiredDocumentsCount: number;
  completedDocumentsCount: number;
  manualApprovalRequired: boolean;
  attorneyReviewRequired: boolean;
  approvalStatus?: string | null;
  attorneyReviewStatus?: string | null;
  relatedModule?: string | null;
  relatedFinancialImpact?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveReport {
  id: string;
  organizationId: string;
  reportType: string;
  reportName: string;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  filters?: Record<string, unknown>;
  reportHtml: string;
  pdfUrl?: string | null;
  archived: boolean;
  version: number;
  generatedBy: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSnapshot {
  estimatedPipelineValue: number;
  totalTargetAssignmentFees: number;
  totalAccruedMoney: number;
  totalPendingPayout: number;
  totalReceivedMoney: number;
  totalExpenses: number;
  netProfitLoss: number;
  projectedProfitLoss: number;
  averageAssignmentFee: number;
  costPerVerifiedLead: number;
  costPerClosedDeal: number;
  winRate: number;
  lossRate: number;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface PipelineAnalytics {
  governmentSignals: number;
  estateSignals: number;
  verifiedLeads: number;
  packetsBuilt: number;
  attorneyReviewsCompleted: number;
  emailsSent: number;
  feeRecorded: number;
  stageCounts: Record<string, number>;
  bottlenecks: Array<{ stage: string; count: number; reason: string }>;
}

export interface CountyPerformanceRow {
  county: string;
  state: string;
  signals: number;
  verifiedLeads: number;
  accruedMoney: number;
  receivedMoney: number;
  expenses: number;
  netProfitLoss: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  government_record_fees: "Government Record Fees",
  document_fees: "Document Fees",
  attorney_review_fees: "Attorney Review Fees",
  title_company_fees: "Title Company Fees",
  mailing_costs: "Mailing Costs",
  enrichment_costs: "Skip Tracing / Enrichment",
  data_provider_costs: "Data Provider Costs",
  email_provider_costs: "Email Provider Costs",
  software_subscription: "Software / Subscription",
  travel_field_research: "Travel / Field Research",
  printing_costs: "Printing Costs",
  marketing_costs: "Marketing Costs",
  admin_costs: "Admin Costs",
  other: "Other",
};
