import type { AttorneyCompensation, AttorneyFeeStatus, AttorneyReview } from "@/lib/types/distribution";

export function validateCompensationApproval(comp: AttorneyCompensation): { ok: boolean; reason?: string } {
  if (comp.compensationType === "not_applicable" || comp.status === "not_applicable") return { ok: true };
  if (comp.status === "approved_by_attorney" && !comp.writtenAgreementUploaded) {
    return {
      ok: false,
      reason:
        "Attorney compensation cannot be marked Approved By Attorney without a written uploaded agreement. Upload the signed fee agreement or set status to Not Applicable.",
    };
  }
  return { ok: true };
}

export function canApproveCompensation(comp: AttorneyCompensation): boolean {
  if (comp.compensationType === "not_applicable") return true;
  return comp.writtenAgreementUploaded === true;
}

export function deriveCompensationStatus(comp: AttorneyCompensation): AttorneyFeeStatus {
  if (comp.compensationType === "not_applicable") return "not_applicable";
  if (comp.status === "approved_by_attorney" && !comp.writtenAgreementUploaded) return "awaiting_written_agreement";
  if (comp.writtenAgreementUploaded) return "written_agreement_uploaded";
  if (comp.proposedPercentage || comp.proposedFlatFee || comp.proposedHourlyFee) return "proposed";
  return comp.status;
}

export function assertCompensationPatchAllowed(
  comp: AttorneyCompensation,
  patch: Partial<AttorneyCompensation>
): { ok: boolean; reason?: string } {
  const nextStatus = patch.status ?? comp.status;
  const nextType = patch.compensationType ?? comp.compensationType;
  const written = patch.writtenAgreementUploaded ?? comp.writtenAgreementUploaded;

  if (nextStatus === "approved_by_attorney" && nextType !== "not_applicable" && !written) {
    return {
      ok: false,
      reason:
        "Written agreement upload is required before marking attorney compensation as Approved By Attorney.",
    };
  }
  return { ok: true };
}

export function syncReviewFeeStatus(review: AttorneyReview, comp: AttorneyCompensation | null): AttorneyFeeStatus {
  if (!comp) return review.attorneyFeeStatus;
  if (comp.compensationType === "not_applicable") return "not_applicable";
  if (comp.writtenAgreementUploaded) return "written_agreement_uploaded";
  if (comp.status === "approved_by_attorney" && comp.writtenAgreementUploaded) return "approved_by_attorney";
  if (review.attorneyFeeAgreementFileUrl) return "written_agreement_uploaded";
  return comp.status;
}

export function compensationHasProposal(comp: AttorneyCompensation): boolean {
  return Boolean(comp.proposedPercentage || comp.proposedFlatFee || comp.proposedHourlyFee);
}

export function reviewHasAttorneyInfo(review: AttorneyReview): boolean {
  return Boolean(review.attorneyName?.trim() || review.attorneyFirm?.trim() || review.attorneyEmail?.trim());
}
