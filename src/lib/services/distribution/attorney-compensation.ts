import "server-only";

import { COMPENSATION_TRACKING_WARNING } from "@/lib/types/distribution";
import type { AttorneyCompensation, AttorneyFeeStatus } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
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
  const updated = saveAttorneyCompensation({ ...comp, ...patch, updatedAt: now() });

  if (patch.writtenAgreementUploaded) {
    logDistributionAudit({
      leadId,
      actionType: "fee_agreement_uploaded",
      actionDescription: "Attorney fee agreement uploaded",
      relatedAttorneyReviewId: review.id,
    });
  }

  return updated;
}

export function canApproveCompensation(comp: AttorneyCompensation): boolean {
  if (comp.compensationType === "not_applicable") return true;
  return comp.writtenAgreementUploaded === true;
}

export function deriveCompensationStatus(comp: AttorneyCompensation): AttorneyFeeStatus {
  if (comp.compensationType === "not_applicable") return "not_applicable";
  if (comp.writtenAgreementUploaded) return "written_agreement_uploaded";
  if (comp.proposedPercentage || comp.proposedFlatFee) return "proposed";
  return comp.status;
}

export { COMPENSATION_TRACKING_WARNING };

export function validateCompensationApproval(comp: AttorneyCompensation): { ok: boolean; reason?: string } {
  if (comp.compensationType === "not_applicable") return { ok: true };
  if (!comp.writtenAgreementUploaded) {
    return {
      ok: false,
      reason: "Attorney compensation cannot be marked approved without a written uploaded agreement or Not Applicable status.",
    };
  }
  return { ok: true };
}
