import "server-only";

import type { AttorneyReview } from "@/lib/types/distribution";
import { MANUAL_OVERRIDE_TEXT } from "@/lib/types/distribution";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadComplianceContext, runLeadComplianceCheck } from "@/lib/services/compliance";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";
import { getAttorneyReview, getAttorneyCompensation, getDistributionPackets } from "./local-store";
import { isAttorneyApproved } from "./attorney-review";
import { validateCompensationApproval } from "./attorney-compensation";

export interface ApprovalGateResult {
  allowed: boolean;
  blockers: string[];
  requiresOverride: boolean;
  overrideAcknowledged: boolean;
  complianceBlockers: string[];
}

export function checkComplianceBlockers(leadId: string): string[] {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return [];

  const ctx = getLeadComplianceContext(leadId);
  const result = runLeadComplianceCheck({
    leadId,
    stateAbbr: lead.state,
    countyName: lead.county,
    dealType: (ctx?.dealType ?? "probate_estate") as DealType,
    acquisitionStrategy: (ctx?.acquisitionStrategy ?? "contract_assignment") as AcquisitionStrategy,
    ownerIdentityVerified: ctx?.ownerIdentityVerified ?? false,
    sourceDocumentsAttached: ctx?.sourceDocumentsAttached ?? false,
    communicationLogActive: ctx?.communicationLogActive ?? false,
    acknowledgementsComplete: (ctx?.acknowledgements?.length ?? 0) > 0,
  });

  if (!result) return [];

  return result.activeBlockers
    .filter((b) => b.status === "active" && (b.severity === "blocking" || b.severity === "restricted"))
    .map((b) => b.blockerMessage);
}

export function checkAttorneyApprovalGate(leadId: string): ApprovalGateResult {
  const review = getAttorneyReview(leadId);
  const blockers: string[] = [];
  const complianceBlockers = checkComplianceBlockers(leadId);

  if (!review) {
    blockers.push("Attorney Review has not been started.");
    return {
      allowed: false,
      blockers,
      requiresOverride: true,
      overrideAcknowledged: false,
      complianceBlockers,
    };
  }

  const attorneyOk =
    isAttorneyApproved(review.reviewStatus) || review.manualOverrideAcknowledged === true;

  if (!isAttorneyApproved(review.reviewStatus)) {
    if (!review.manualOverrideAcknowledged) {
      blockers.push(
        "Attorney Review has not been completed. Upload attorney-reviewed documents or acknowledge manual override before external distribution. EstateLeadOS does not provide legal approval."
      );
    }
  }

  const hasReviewedUpload = review.uploads.some(
    (u) =>
      u.documentCategory === "attorney_reviewed_packet" ||
      u.documentCategory === "attorney_approval_letter"
  );
  if (isAttorneyApproved(review.reviewStatus) && !hasReviewedUpload && !review.approvedFileUrl) {
    blockers.push("Attorney reviewed packet or approval letter not uploaded.");
  }

  const comp = getAttorneyCompensation(leadId);
  if (comp && comp.compensationType !== "not_applicable" && comp.compensationType !== "not_set") {
    const compCheck = validateCompensationApproval(comp);
    if (!compCheck.ok) blockers.push(compCheck.reason!);
  }

  if (review.reviewStatus === "fee_agreement_missing") {
    blockers.push("Attorney fee agreement missing.");
  }

  const distributionPackets = getDistributionPackets({ leadId });
  const needsRedaction = distributionPackets.some(
    (p) => p.redactionChecklist.some((r) => !r.complete)
  );
  if (needsRedaction) {
    blockers.push("Redaction checklist incomplete on distribution packet.");
  }

  if (complianceBlockers.length > 0) {
    blockers.push(...complianceBlockers.map((m) => `Compliance: ${m}`));
  }

  return {
    allowed: attorneyOk && blockers.length === 0,
    blockers,
    requiresOverride: !isAttorneyApproved(review.reviewStatus),
    overrideAcknowledged: review.manualOverrideAcknowledged ?? false,
    complianceBlockers,
  };
}

export { MANUAL_OVERRIDE_TEXT };

export function canApproveDistributionSend(leadId: string, packetStatus: string): ApprovalGateResult {
  const gate = checkAttorneyApprovalGate(leadId);
  if (packetStatus !== "approved_to_send") {
    gate.blockers.push("Distribution packet must be Approved to Send.");
    gate.allowed = false;
  }
  return gate;
}

export function getAttorneyGateSummary(leadId: string): {
  review: AttorneyReview | null;
  attorneyApproved: boolean;
  overrideAcknowledged: boolean;
  complianceClear: boolean;
} {
  const review = getAttorneyReview(leadId);
  const gate = checkAttorneyApprovalGate(leadId);
  return {
    review,
    attorneyApproved: review ? isAttorneyApproved(review.reviewStatus) : false,
    overrideAcknowledged: review?.manualOverrideAcknowledged ?? false,
    complianceClear: gate.complianceBlockers.length === 0,
  };
}
