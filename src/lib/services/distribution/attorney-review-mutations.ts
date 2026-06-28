import type { AttorneyReview, AttorneyReviewStatus } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
import {
  createAttorneyReview,
  getAttorneyReview,
  saveAttorneyReview,
  logDistributionAudit,
} from "./local-store";

export function updateAttorneyReview(
  leadId: string,
  patch: Partial<AttorneyReview>
): AttorneyReview {
  const review = getAttorneyReview(leadId) ?? createAttorneyReview(leadId);
  const prior = review.reviewStatus;
  const updated = saveAttorneyReview({ ...review, ...patch, updatedAt: new Date().toISOString() });
  if (patch.reviewStatus && patch.reviewStatus !== prior) {
    logDistributionAudit({
      leadId,
      packetId: updated.packetId,
      actionType: "attorney_review_status_changed",
      actionDescription: `Attorney review status: ${prior} → ${patch.reviewStatus}`,
      relatedAttorneyReviewId: updated.id,
    });
  }
  return updated;
}

export function markSentToAttorney(leadId: string): AttorneyReview {
  return updateAttorneyReview(leadId, {
    reviewStatus: "sent_delivered_manually",
    reviewRequestedAt: new Date().toISOString(),
  });
}

export function acknowledgeManualOverride(leadId: string): AttorneyReview {
  const session = getSessionContext();
  const updated = updateAttorneyReview(leadId, {
    manualOverrideAcknowledged: true,
    manualOverrideAt: new Date().toISOString(),
    manualOverrideBy: session.userName,
  });
  logDistributionAudit({
    leadId,
    actionType: "manual_override_acknowledged",
    actionDescription: "User acknowledged manual override for external distribution without attorney approval",
    relatedAttorneyReviewId: updated.id,
    metadata: { overrideBy: session.userName },
  });
  return updated;
}

export function isAttorneyApproved(status: AttorneyReviewStatus): boolean {
  return status === "approved" || status === "approved_with_notes";
}
