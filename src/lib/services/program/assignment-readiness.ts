import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getPipelineItems } from "@/lib/services/pipeline/local-store";
import type { AssignmentReadiness, AssignmentReadinessStatus } from "@/lib/types/program";
import {
  ASSIGNMENT_CHECKLIST_TEMPLATE,
  createEmptyAssignmentReadiness,
  getAssignmentReadiness,
  saveAssignmentReadiness,
} from "./local-store";
import { getRequiredDocuments } from "./local-store";
import { getProgramPackets } from "./local-store";

export function evaluateAssignmentReadiness(leadId: string, packetId?: string): AssignmentReadiness {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(leadId);
  const existing = getAssignmentReadiness(leadId) ?? createEmptyAssignmentReadiness(leadId);
  const docs = getRequiredDocuments(leadId);
  const packets = getProgramPackets({ leadId });
  const pipelineItems = getPipelineItems().filter((i) => i.leadId === leadId);

  const govVerified =
    pipelineItems.some((i) => i.pipelineStage === "verified_government_lead" && i.leadId === leadId) ||
    (lead as { governmentVerificationStatus?: string })?.governmentVerificationStatus === "verified_government_lead";
  const manualApproval = pipelineItems.some((i) => i.manuallyApproved);
  const hasPacket = packets.length > 0;
  const assignmentDocs = docs.filter((d) => d.requiredForAssignmentReview);
  const missingAssignmentDocs = assignmentDocs.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload"].includes(d.status)
  );

  const checklist = ASSIGNMENT_CHECKLIST_TEMPLATE.map((item) => {
    let complete = false;
    switch (item.id) {
      case "gov_verified":
        complete = govVerified;
        break;
      case "manual_approval":
        complete = manualApproval;
        break;
      case "outreach_approved":
        complete = false;
        break;
      case "disclosures":
        complete = docs.some((d) => d.documentType === "compliance_checklist" && d.status !== "missing");
        break;
      case "attorney_reminder":
        complete = true;
        break;
      case "deal_calc":
        complete = docs.some((d) => d.documentType === "deal_calculator_printout" && d.status !== "missing");
        break;
      case "compliance_clear":
        complete = missingAssignmentDocs.length === 0;
        break;
      case "fee_target":
        complete = (existing.targetAssignmentFee ?? 0) > 0;
        break;
      case "min_spread":
        complete = (existing.minimumAcceptableSpread ?? 0) > 0;
        break;
      default:
        complete = false;
    }
    return { ...item, complete };
  });

  const requiredIncomplete = checklist.filter((c) => c.required && !c.complete);
  let status: AssignmentReadinessStatus = "research_only";
  if (govVerified && manualApproval && hasPacket) status = "assignment_packet_draft";
  if (requiredIncomplete.length === 0 && govVerified && manualApproval) status = "assignment_review_needed";
  if (!govVerified) status = "research_only";

  const record: AssignmentReadiness = {
    ...existing,
    organizationId: session.organizationId,
    packetId: packetId ?? packets[0]?.id ?? null,
    status,
    complianceBlockersClear: missingAssignmentDocs.length === 0,
    checklist,
    updatedAt: new Date().toISOString(),
  };

  return saveAssignmentReadiness(record);
}

export function updateAssignmentFees(
  leadId: string,
  fees: { targetAssignmentFee?: number; minimumAcceptableSpread?: number }
): AssignmentReadiness {
  const existing = getAssignmentReadiness(leadId) ?? createEmptyAssignmentReadiness(leadId);
  return saveAssignmentReadiness({
    ...existing,
    targetAssignmentFee: fees.targetAssignmentFee ?? existing.targetAssignmentFee,
    minimumAcceptableSpread: fees.minimumAcceptableSpread ?? existing.minimumAcceptableSpread,
    updatedAt: new Date().toISOString(),
  });
}
