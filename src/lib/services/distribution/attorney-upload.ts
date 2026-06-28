import type { AttorneyUploadCategory } from "@/lib/types/distribution";
import {
  addAttorneyUpload,
  getAttorneyCompensation,
  getAttorneyReview,
  logDistributionAudit,
  saveAttorneyCompensation,
} from "./local-store";
import { updateAttorneyReview } from "./attorney-review-mutations";
import { updateDraftDocumentsFromReview } from "./attorney-review-workflow";

export function uploadAttorneyFile(input: {
  leadId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  documentCategory: AttorneyUploadCategory;
  notes?: string;
  packetId?: string;
}) {
  const review = getAttorneyReview(input.leadId);
  if (!review) throw new Error("Start attorney review first");

  const upload = addAttorneyUpload(input.leadId, {
    leadId: input.leadId,
    attorneyReviewId: review.id,
    packetId: input.packetId ?? review.packetId,
    fileName: input.fileName,
    fileType: input.fileType,
    fileUrl: input.fileUrl,
    documentCategory: input.documentCategory,
    notes: input.notes,
    reviewStatus: review.reviewStatus,
  });

  let newStatus = review.reviewStatus;
  if (input.documentCategory === "attorney_reviewed_packet") newStatus = "under_attorney_review";
  if (input.documentCategory === "attorney_approval_letter") newStatus = "approved_with_notes";
  if (input.documentCategory === "attorney_comments") newStatus = "under_attorney_review";
  if (input.documentCategory === "attorney_redlines") newStatus = "changes_requested";
  if (input.documentCategory === "attorney_engagement_agreement") {
    updateAttorneyReview(input.leadId, { attorneyEngagementFileUrl: input.fileUrl });
  }
  if (input.documentCategory === "attorney_fee_agreement") {
    const comp = getAttorneyCompensation(input.leadId);
    if (comp) {
      saveAttorneyCompensation({
        ...comp,
        writtenAgreementUploaded: true,
        agreementFileUrl: input.fileUrl,
        status: comp.status === "approved_by_attorney" ? "approved_by_attorney" : "written_agreement_uploaded",
        updatedAt: new Date().toISOString(),
      });
    }
    updateAttorneyReview(input.leadId, {
      attorneyFeeAgreementFileUrl: input.fileUrl,
      attorneyFeeStatus: "written_agreement_uploaded",
    });
  }

  const updatedReview = updateAttorneyReview(input.leadId, {
    reviewStatus: newStatus,
    approvedFileUrl:
      input.documentCategory === "attorney_reviewed_packet" ? input.fileUrl : review.approvedFileUrl,
    signedReviewLetterUrl:
      input.documentCategory === "attorney_approval_letter" ? input.fileUrl : review.signedReviewLetterUrl,
  });

  updateDraftDocumentsFromReview(input.leadId, updatedReview);

  logDistributionAudit({
    leadId: input.leadId,
    packetId: input.packetId ?? review.packetId,
    actionType: "attorney_file_uploaded",
    actionDescription: `Uploaded ${input.documentCategory} v${upload.versionNumber}: ${input.fileName}`,
    relatedAttorneyReviewId: review.id,
    metadata: { versionNumber: upload.versionNumber, category: input.documentCategory },
  });

  return upload;
}
