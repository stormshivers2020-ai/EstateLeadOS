import type { PayoutReadiness, PayoutReadinessStatus } from "./automationTypes";

export interface PayoutReadinessInput {
  leadId: string;
  organizationId: string;
  assignmentId?: string | null;
  actualAssignmentFee?: number | null;
  closingDate?: string | null;
  titleCompany?: string | null;
  buyerId?: string | null;
  sellerName?: string | null;
  signedDocumentsComplete?: boolean;
  complianceClear?: boolean;
  documentPacketComplete?: boolean;
  paymentProviderConnected?: boolean;
  assignmentClosed?: boolean;
}

export function computePayoutReadinessStatus(input: PayoutReadinessInput): PayoutReadinessStatus {
  if (!input.assignmentId) return "not_started";
  if (!input.assignmentClosed) return "not_ready";
  if (!input.closingDate) return "missing_closing_confirmation";
  if (input.actualAssignmentFee == null) return "missing_assignment_fee";
  if (!input.buyerId || !input.sellerName) return "missing_buyer_seller_data";
  if (!input.titleCompany) return "missing_title_company_confirmation";
  if (!input.signedDocumentsComplete) return "missing_signed_documents";
  if (!input.paymentProviderConnected) return "payment_provider_not_connected";
  if (!input.complianceClear) return "not_ready";
  if (!input.documentPacketComplete) return "not_ready";
  return "ready_for_payout_review";
}

export function buildPayoutReadinessRecord(input: PayoutReadinessInput): PayoutReadiness {
  const now = new Date().toISOString();
  const status = computePayoutReadinessStatus(input);
  return {
    id: `payout-${input.leadId}-${Date.now()}`,
    organizationId: input.organizationId,
    leadId: input.leadId,
    assignmentId: input.assignmentId ?? null,
    actualAssignmentFee: input.actualAssignmentFee ?? null,
    closingDate: input.closingDate ?? null,
    titleCompany: input.titleCompany ?? null,
    buyerId: input.buyerId ?? null,
    sellerName: input.sellerName ?? null,
    signedDocumentsStatus: input.signedDocumentsComplete ? "complete" : "incomplete",
    complianceStatus: input.complianceClear ? "workflow_ready" : "review_required",
    documentPacketStatus: input.documentPacketComplete ? "complete" : "incomplete",
    paymentProviderStatus: input.paymentProviderConnected ? "connected_placeholder" : "not_connected",
    bankPayoutMethodPlaceholder: input.paymentProviderConnected ? "Stripe Connect / ACH placeholder" : null,
    payoutApprovalStatus: status === "ready_for_payout_review" ? "pending" : "not_required",
    payoutReadinessStatus: status,
    payoutNotes: "EstateLeadOS tracks payout readiness and recorded outcomes. Actual funds movement requires a connected, approved payment provider, title-company process, or external banking workflow.",
    createdAt: now,
    updatedAt: now,
  };
}

export const PAYOUT_STATUS_LABELS: Record<PayoutReadinessStatus, string> = {
  not_started: "Not Started",
  not_ready: "Not Ready",
  missing_closing_confirmation: "Missing Closing Confirmation",
  missing_assignment_fee: "Missing Assignment Fee",
  missing_buyer_seller_data: "Missing Buyer/Seller Data",
  missing_title_company_confirmation: "Missing Title Company Confirmation",
  missing_signed_documents: "Missing Signed Documents",
  missing_payout_method: "Missing Payout Method",
  payment_provider_not_connected: "Payment Provider Not Connected",
  ready_for_payout_review: "Ready for Payout Review",
  payout_approved: "Payout Approved",
  payout_processing_placeholder: "Payout Processing Placeholder",
  payout_completed_manually: "Payout Completed Manually",
  payout_failed_placeholder: "Payout Failed Placeholder",
};
