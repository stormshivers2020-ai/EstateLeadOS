import "server-only";

import type { AttorneyReview } from "@/lib/types/distribution";
import { MANUAL_OVERRIDE_TEXT } from "@/lib/types/distribution";
import { getAttorneyReview } from "./local-store";
import { isAttorneyApproved } from "./attorney-review";
import { getAttorneyCompensation } from "./local-store";
import { validateCompensationApproval } from "./attorney-compensation";
import { getDistributionPackets } from "./local-store";

export interface ApprovalGateResult {
  allowed: boolean;
  blockers: string[];
  requiresOverride: boolean;
  overrideAcknowledged: boolean;
}

export function checkAttorneyApprovalGate(leadId: string): ApprovalGateResult {
  const review = getAttorneyReview(leadId);
  const blockers: string[] = [];

  if (!review) {
    blockers.push("Attorney Review has not been started.");
    return {
      allowed: false,
      blockers,
      requiresOverride: true,
      overrideAcknowledged: false,
    };
  }

  const attorneyOk =
    isAttorneyApproved(review.reviewStatus) || review.manualOverrideAcknowledged === true;

  if (!isAttorneyApproved(review.reviewStatus)) {
    if (!review.manualOverrideAcknowledged) {
      blockers.push(
        "Attorney Review has not been completed. You may continue only after uploading attorney-reviewed documents or using a manual override acknowledgement. EstateLeadOS does not provide legal approval."
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

  return {
    allowed: attorneyOk && blockers.length === 0,
    blockers,
    requiresOverride: !isAttorneyApproved(review.reviewStatus),
    overrideAcknowledged: review.manualOverrideAcknowledged ?? false,
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
