import { FINAL_ARCHIVE_STEP } from "@/lib/constants/process-steps";
import { ATTORNEY_REVIEW_WORKFLOW_STEPS } from "@/lib/constants/distribution-templates";
import type { AttorneyCompensation, AttorneyReview, AttorneyReviewStatus } from "@/lib/types/distribution";
import type { DraftSignatureDocumentStatus } from "@/lib/types/program";
import { saveToFinalAttorneyArchive } from "@/lib/services/program/archive-hub";
import {
  getDraftSignatureDocuments,
  getProgramPacket,
  getProgramPackets,
  saveDraftSignatureDocuments,
  updateProgramPacket,
} from "@/lib/services/program/local-store";
import {
  compensationHasProposal,
  reviewHasAttorneyInfo,
  syncReviewFeeStatus,
} from "./attorney-compensation-rules";
import {
  getAttorneyCompensation,
  getAttorneyReview,
  logDistributionAudit,
  saveAttorneyReview,
} from "./local-store";
import { updateAttorneyReview } from "./attorney-review-mutations";

export interface WorkflowStepState {
  step: number;
  key: string;
  label: string;
  complete: boolean;
  detail?: string;
}

function isApprovedStatus(status: AttorneyReviewStatus): boolean {
  return status === "approved" || status === "approved_with_notes";
}

export function inferWorkflowSteps(
  review: AttorneyReview | null,
  compensation: AttorneyCompensation | null
): WorkflowStepState[] {
  const r = review;
  const c = compensation;
  const hasReviewedUpload = Boolean(r?.uploads.some((u) => u.documentCategory === "attorney_reviewed_packet"));
  const hasFeeUpload = Boolean(
    r?.uploads.some((u) => u.documentCategory === "attorney_fee_agreement")
    || c?.writtenAgreementUploaded
    || r?.attorneyFeeAgreementFileUrl
  );
  const feeApplicable = c?.compensationType !== "not_applicable";

  return ATTORNEY_REVIEW_WORKFLOW_STEPS.map((s) => {
    switch (s.key) {
      case "select_packet":
        return { ...s, complete: Boolean(r?.packetId), detail: r?.packetId ? "Packet linked" : "Select a packet" };
      case "attorney_info":
        return { ...s, complete: Boolean(r && reviewHasAttorneyInfo(r)), detail: r?.attorneyName ?? undefined };
      case "print_export":
        return { ...s, complete: Boolean(r?.attorneyReviewFileHtml), detail: r?.attorneyReviewFileHtml ? "Review file ready" : undefined };
      case "delivery":
        return {
          ...s,
          complete: Boolean(
            r && ["sent_delivered_manually", "under_attorney_review", "changes_requested", "approved", "approved_with_notes", "archived"].includes(r.reviewStatus)
          ),
          detail: r?.reviewStatus ? r.reviewStatus.replace(/_/g, " ") : undefined,
        };
      case "comments":
        return { ...s, complete: Boolean(r?.reviewNotes?.trim()), detail: r?.reviewNotes ? "Comments recorded" : undefined };
      case "changes":
        return { ...s, complete: Boolean(r?.changesRequested?.trim()), detail: r?.changesRequested ? "Changes tracked" : undefined };
      case "approval":
        return { ...s, complete: Boolean(r && isApprovedStatus(r.reviewStatus)), detail: r?.reviewStatus };
      case "fee_agreement":
        return {
          ...s,
          complete: Boolean(c && (c.compensationType === "not_applicable" || compensationHasProposal(c))),
          detail: c?.compensationType?.replace(/_/g, " "),
        };
      case "upload_reviewed":
        return { ...s, complete: hasReviewedUpload, detail: hasReviewedUpload ? "Reviewed file uploaded" : undefined };
      case "upload_fee_agreement":
        return {
          ...s,
          complete: !feeApplicable || hasFeeUpload,
          detail: feeApplicable ? (hasFeeUpload ? "Fee agreement on file" : "Upload if applicable") : "Not applicable",
        };
      case "document_statuses":
        return {
          ...s,
          complete: Boolean(r && (hasReviewedUpload || isApprovedStatus(r.reviewStatus))),
          detail: "Draft document statuses updated on upload",
        };
      case "final_archive":
        return {
          ...s,
          complete: r?.reviewStatus === "archived",
          detail: r?.reviewStatus === "archived" ? `Stored — Step ${FINAL_ARCHIVE_STEP}` : undefined,
        };
    }
  });
}

export function selectPacketForAttorneyReview(leadId: string, packetId: string): AttorneyReview {
  const packet = getProgramPacket(packetId);
  if (!packet || packet.leadId !== leadId) throw new Error("Packet not found for this lead");

  const review = updateAttorneyReview(leadId, {
    packetId,
    reviewStatus: "packet_ready_for_attorney",
    reviewRequestedAt: new Date().toISOString(),
  });

  updateProgramPacket(packetId, { attorneyReviewStatus: "ready_for_attorney_review" });

  logDistributionAudit({
    leadId,
    packetId,
    actionType: "attorney_packet_selected",
    actionDescription: `Packet v${packet.packetVersion} selected for attorney review`,
    relatedAttorneyReviewId: review.id,
  });

  return review;
}

function mapDraftStatusAfterReview(reviewStatus: AttorneyReviewStatus): DraftSignatureDocumentStatus {
  if (reviewStatus === "changes_requested") return "attorney_changes_requested";
  if (reviewStatus === "approved" || reviewStatus === "approved_with_notes") return "attorney_approved";
  if (reviewStatus === "rejected") return "rejected";
  return "ready_for_attorney_review";
}

export function updateDraftDocumentsFromReview(leadId: string, review: AttorneyReview): void {
  const docs = getDraftSignatureDocuments({ leadId, packetId: review.packetId ?? undefined });
  if (docs.length === 0) return;

  const nextStatus = mapDraftStatusAfterReview(review.reviewStatus);
  saveDraftSignatureDocuments(
    docs.map((d) => ({
      ...d,
      status: review.reviewStatus === "approved" ? "ready_for_signature" : nextStatus,
      updatedAt: new Date().toISOString(),
    }))
  );
}

export function moveReviewedFilesToFinalArchive(leadId: string): {
  archiveId: string;
  message: string;
} {
  const review = getAttorneyReview(leadId);
  if (!review) throw new Error("Attorney review not started");
  if (!review.packetId) throw new Error("Select a packet before moving to Final Archive");

  const hasReviewedFile = review.uploads.some((u) => u.documentCategory === "attorney_reviewed_packet")
    || review.approvedFileUrl;
  if (!hasReviewedFile) {
    throw new Error("Upload an attorney-reviewed file before moving to Final Archive.");
  }

  const packet = getProgramPacket(review.packetId);
  if (!packet) throw new Error("Source packet not found");

  const archive = saveToFinalAttorneyArchive(leadId);

  const comp = getAttorneyCompensation(leadId);
  const updatedReview = saveAttorneyReview({
    ...review,
    reviewStatus: "archived",
    reviewCompletedAt: review.reviewCompletedAt ?? new Date().toISOString(),
    attorneyFeeStatus: syncReviewFeeStatus(review, comp),
    updatedAt: new Date().toISOString(),
  });

  updateDraftDocumentsFromReview(leadId, updatedReview);

  logDistributionAudit({
    leadId,
    packetId: review.packetId,
    actionType: "final_archive_stored",
    actionDescription: `Attorney-reviewed files moved to Final Archive (Step ${FINAL_ARCHIVE_STEP})`,
    relatedAttorneyReviewId: review.id,
    metadata: { archiveId: archive.id },
  });

  return {
    archiveId: archive.id,
    message: `Reviewed files stored in Final Archive (Step ${FINAL_ARCHIVE_STEP}). Not legal approval.`,
  };
}

export function listLeadPacketsForReview(leadId: string) {
  return getProgramPackets({ leadId }).filter((p) => p.printableHtml);
}
