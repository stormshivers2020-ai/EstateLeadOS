import type { AttorneyCompensation } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
import {
  assertCompensationPatchAllowed,
  deriveCompensationStatus,
  validateCompensationApproval,
} from "./attorney-compensation-rules";
import {
  getAttorneyCompensation,
  saveAttorneyCompensation,
  getAttorneyReview,
  logDistributionAudit,
} from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function getOrCreateCompensation(leadId: string, attorneyReviewId: string): AttorneyCompensation {
  const existing = getAttorneyCompensation(leadId);
  if (existing) return existing;
  const session = getSessionContext();
  const comp: AttorneyCompensation = {
    id: uid("ac"),
    organizationId: session.organizationId,
    attorneyReviewId,
    leadId,
    compensationType: "not_set",
    paidFromAssignmentFee: false,
    paymentDueCondition: "not_set",
    writtenAgreementUploaded: false,
    status: "not_discussed",
    createdAt: now(),
    updatedAt: now(),
  };
  return saveAttorneyCompensation(comp);
}

export function updateCompensation(
  leadId: string,
  patch: Partial<AttorneyCompensation>
): AttorneyCompensation {
  const review = getAttorneyReview(leadId);
  if (!review) throw new Error("Attorney review not found");
  const comp = getOrCreateCompensation(leadId, review.id);

  const guard = assertCompensationPatchAllowed(comp, patch);
  if (!guard.ok) throw new Error(guard.reason);

  const merged = { ...comp, ...patch, updatedAt: now() };
  const validation = validateCompensationApproval(merged);
  if (!validation.ok) throw new Error(validation.reason);

  const updated = saveAttorneyCompensation({
    ...merged,
    status: patch.status ?? deriveCompensationStatus(merged),
  });

  if (patch.writtenAgreementUploaded) {
    logDistributionAudit({
      leadId,
      actionType: "fee_agreement_uploaded",
      actionDescription: "Attorney fee agreement uploaded",
      relatedAttorneyReviewId: review.id,
    });
  }

  if (patch.status || patch.compensationType || patch.proposedPercentage || patch.proposedFlatFee || patch.proposedHourlyFee) {
    logDistributionAudit({
      leadId,
      actionType: "compensation_updated",
      actionDescription: `Compensation tracked: ${updated.compensationType} · ${updated.status}`,
      relatedAttorneyReviewId: review.id,
      metadata: {
        proposedPercentage: updated.proposedPercentage,
        proposedFlatFee: updated.proposedFlatFee,
        proposedHourlyFee: updated.proposedHourlyFee,
      },
    });
  }

  return updated;
}
