import type { Assignment, AssignmentStage } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { Buyer } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { DocumentRecord } from "@/lib/types/documents";
import type { ComplianceCheckResult } from "@/lib/types/compliance";

export interface AssignmentStageChangeResult {
  allowed: boolean;
  fromStage: AssignmentStage;
  toStage: AssignmentStage;
  blockedReason: string | null;
  complianceMessage: string | null;
  missingItems: string[];
}

const STAGE_ORDER: AssignmentStage[] = [
  "lead_under_contract", "compliance_review", "buyer_match_started",
  "buyer_interest_confirmed", "buyer_disclosure_needed", "assignment_terms_drafted",
  "assignment_sent", "assignment_signed", "earnest_money_confirmed",
  "title_company_confirmed", "closing_scheduled", "closed", "fee_recorded",
];

function isDocComplete(doc: DocumentRecord | undefined): boolean {
  if (!doc) return false;
  return ["generated", "uploaded", "signed", "reviewed", "approved"].includes(doc.status);
}

export function validateAssignmentStageChange(
  fromStage: AssignmentStage,
  toStage: AssignmentStage,
  context: {
    assignment: Assignment;
    buyer: Buyer | null;
    documents: DocumentRecord[];
    complianceCheck: ComplianceCheckResult | null;
    leadUnderContract: boolean;
  }
): AssignmentStageChangeResult {
  const missingItems: string[] = [];

  if (toStage === "cancelled") {
    return { allowed: true, fromStage, toStage, blockedReason: null, complianceMessage: null, missingItems: [] };
  }

  const fromIdx = STAGE_ORDER.indexOf(fromStage);
  const toIdx = STAGE_ORDER.indexOf(toStage);
  if (toIdx >= 0 && fromIdx >= 0 && toIdx > fromIdx + 1) {
    return {
      allowed: false, fromStage, toStage,
      blockedReason: "Cannot skip assignment stages.",
      complianceMessage: "Complete each stage in order.",
      missingItems: [],
    };
  }

  if (toStage === "assignment_terms_drafted") {
    if (!context.leadUnderContract) missingItems.push("Lead must be Under Contract");
    if (!context.buyer) missingItems.push("Buyer must be selected");
    if (context.buyer && context.buyer.proofOfFundsStatus !== "on_file") {
      missingItems.push("Buyer proof of funds on file or acknowledged");
    }
    if (!context.assignment.titleCompany) missingItems.push("Title company selected or acknowledged");
    const disclosure = context.documents.find((d) => d.documentTypeId === "assignment_disclosure_checklist");
    if (!isDocComplete(disclosure)) missingItems.push("Assignment disclosure checklist");
  }

  if (toStage === "assignment_sent") {
    const required = [
      "assignment_disclosure_checklist",
      "buyer_assignee_disclosure_ack",
      "assignment_agreement_checklist",
      "buyer_profile_sheet",
    ];
    for (const typeId of required) {
      const doc = context.documents.find((d) => d.documentTypeId === typeId);
      if (!isDocComplete(doc)) missingItems.push(typeId.replace(/_/g, " "));
    }
    if (context.complianceCheck?.riskLevel === "restricted") {
      missingItems.push("Restricted compliance blocker unresolved");
    }
    if (context.complianceCheck?.activeBlockers.some((b) => b.status === "active")) {
      missingItems.push("Active compliance blockers");
    }
  }

  if (toStage === "assignment_signed") {
    if (fromStage !== "assignment_sent") missingItems.push("Assignment must be sent first");
    const signed = context.documents.filter((d) => d.signatureNeededFlag && d.signatureStatus !== "signed");
    if (signed.length > 0) missingItems.push("Signature status not updated for required documents");
  }

  if (toStage === "closing_scheduled") {
    const closingReqs = ["closing_checklist", "title_company_intake", "communication_log_export", "source_document_packet", "deal_memo"];
    for (const typeId of closingReqs) {
      const doc = context.documents.find((d) => d.documentTypeId === typeId);
      if (!isDocComplete(doc)) missingItems.push(typeId.replace(/_/g, " "));
    }
    if (!context.assignment.titleCompany) missingItems.push("Title company confirmed");
  }

  if (toStage === "fee_recorded") {
    if (fromStage !== "closed" && fromStage !== "closing_scheduled") {
      missingItems.push("Assignment must be closed first");
    }
    if (!context.assignment.actualAssignmentFee) missingItems.push("Actual fee must be entered");
    if (!context.assignment.closingDate) missingItems.push("Closing date must be entered");
    if (!context.assignment.buyerId) missingItems.push("Buyer must be recorded");
  }

  if (missingItems.length > 0) {
    return {
      allowed: false, fromStage, toStage,
      blockedReason: `${missingItems.length} requirement(s) not met for ${toStage.replace(/_/g, " ")}.`,
      complianceMessage: missingItems.join(" · "),
      missingItems,
    };
  }

  return { allowed: true, fromStage, toStage, blockedReason: null, complianceMessage: null, missingItems: [] };
}

export function validateBuyerMatchingStage(params: {
  complianceCheck: ComplianceCheckResult | null;
  documentBlockers: number;
  acknowledgementsComplete: boolean;
}): { allowed: boolean; message: string | null; missingItems: string[] } {
  const missing: string[] = [];
  if (params.documentBlockers > 0) missing.push(`${params.documentBlockers} document workflow blocker(s)`);
  if (params.complianceCheck?.riskLevel === "restricted") missing.push("Restricted compliance risk");
  if (params.complianceCheck?.activeBlockers.some((b) => b.status === "active")) {
    missing.push("Active compliance blockers");
  }
  if (!params.acknowledgementsComplete && params.complianceCheck &&
    ["elevated", "high", "attorney_review_required"].includes(params.complianceCheck.riskLevel)) {
    missing.push("Compliance acknowledgement incomplete");
  }
  if (missing.length > 0) {
    return { allowed: false, message: missing.join(" · "), missingItems: missing };
  }
  return { allowed: true, message: null, missingItems: [] };
}
