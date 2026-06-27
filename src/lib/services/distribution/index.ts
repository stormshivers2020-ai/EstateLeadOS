import "server-only";

export { buildAttorneyReviewFile, updateAttorneyReview, markSentToAttorney, acknowledgeManualOverride, isAttorneyApproved } from "./attorney-review";
export { getOrCreateCompensation, updateCompensation, canApproveCompensation, validateCompensationApproval, COMPENSATION_TRACKING_WARNING } from "./attorney-compensation";
export { checkAttorneyApprovalGate, canApproveDistributionSend, MANUAL_OVERRIDE_TEXT } from "./approval-gate";
export { buildDistributionPacket, updateRedactionChecklist, approveDistributionForSend, DISTRIBUTION_TYPE_LABELS } from "./distribution-packet";
export { renderEmailTemplate, validateEmailSend, sendDistributionEmail, getEmailLogs } from "./email-distribution";
export {
  getAttorneyReview,
  createAttorneyReview,
  addAttorneyUpload,
  getAttorneyCompensation,
  getDistributionPackets,
  getDistributionPacket,
  getEmailDistributions,
  getExternalRecipients,
  saveExternalRecipient,
  seedExternalRecipientsFromBuyers,
  getDistributionAuditLogs,
  logDistributionAudit,
} from "./local-store";

import {
  addAttorneyUpload,
  getAttorneyReview,
  logDistributionAudit,
} from "./local-store";
import { updateAttorneyReview } from "./attorney-review";
import type { AttorneyUploadCategory } from "@/lib/types/distribution";

export async function uploadAttorneyFile(input: {
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
  });

  let newStatus = review.reviewStatus;
  if (input.documentCategory === "attorney_reviewed_packet") newStatus = "under_attorney_review";
  if (input.documentCategory === "attorney_approval_letter") newStatus = "approved_with_notes";
  if (input.documentCategory === "attorney_fee_agreement") {
    updateAttorneyReview(input.leadId, {
      attorneyFeeAgreementFileUrl: input.fileUrl,
      attorneyFeeStatus: "written_agreement_uploaded",
    });
  }

  updateAttorneyReview(input.leadId, {
    reviewStatus: newStatus,
    approvedFileUrl:
      input.documentCategory === "attorney_reviewed_packet" ? input.fileUrl : review.approvedFileUrl,
    signedReviewLetterUrl:
      input.documentCategory === "attorney_approval_letter" ? input.fileUrl : review.signedReviewLetterUrl,
  });

  logDistributionAudit({
    leadId: input.leadId,
    packetId: input.packetId,
    actionType: "attorney_file_uploaded",
    actionDescription: `Uploaded ${input.documentCategory} v${upload.versionNumber}`,
    relatedAttorneyReviewId: review.id,
  });

  return upload;
}
