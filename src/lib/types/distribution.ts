export type AttorneyReviewStatus =
  | "not_started"
  | "packet_ready_for_attorney"
  | "sent_delivered_manually"
  | "under_attorney_review"
  | "changes_requested"
  | "approved_with_notes"
  | "approved"
  | "rejected"
  | "needs_more_documentation"
  | "attorney_engagement_missing"
  | "fee_agreement_missing"
  | "archived";

export type AttorneyFeeStatus =
  | "not_discussed"
  | "proposed"
  | "awaiting_written_agreement"
  | "written_agreement_uploaded"
  | "approved_by_attorney"
  | "rejected"
  | "needs_revision"
  | "not_applicable";

export type CompensationType =
  | "not_set"
  | "flat_fee"
  | "hourly"
  | "contingent_percentage"
  | "hybrid"
  | "other"
  | "not_applicable";

export type PaymentDueCondition =
  | "due_now"
  | "due_after_review"
  | "due_at_closing"
  | "due_from_assignment_fee_if_closing"
  | "other_written_agreement"
  | "not_set";

export type DistributionPacketType =
  | "buyer_opportunity"
  | "realtor_review"
  | "investor_review"
  | "real_estate_company"
  | "title_company_review";

export type DistributionPacketStatus =
  | "draft"
  | "needs_attorney_review"
  | "attorney_approved"
  | "ready_for_user_review"
  | "approved_to_send"
  | "sent"
  | "buyer_interested"
  | "buyer_declined"
  | "follow_up_needed"
  | "archived";

export type EmailSendStatus =
  | "draft"
  | "preview"
  | "approved"
  | "sent"
  | "simulated"
  | "failed"
  | "blocked";

export type RecipientType =
  | "cash_buyer"
  | "investor"
  | "realtor"
  | "real_estate_company"
  | "acquisition_manager"
  | "title_company"
  | "attorney"
  | "other";

export type RecipientResponseStatus =
  | "not_contacted"
  | "packet_sent"
  | "opened_placeholder"
  | "interested"
  | "needs_more_info"
  | "declined"
  | "follow_up_needed"
  | "do_not_contact"
  | "bad_email"
  | "archived";

export type AttorneyUploadCategory =
  | "attorney_reviewed_packet"
  | "attorney_approval_letter"
  | "attorney_redlines"
  | "attorney_comments"
  | "attorney_fee_agreement"
  | "attorney_engagement_agreement"
  | "title_company_notes"
  | "revised_draft_documents"
  | "signed_documents"
  | "disclosure_checklist"
  | "revised_buyer_packet"
  | "revised_assignment_packet"
  | "other_review_document";

export interface AttorneyReviewUpload {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  attorneyReviewId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  documentCategory: AttorneyUploadCategory;
  versionNumber: number;
  notes?: string | null;
  reviewStatus?: string | null;
}

export interface AttorneyReview {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  attorneyName?: string | null;
  attorneyFirm?: string | null;
  attorneyEmail?: string | null;
  attorneyPhone?: string | null;
  reviewStatus: AttorneyReviewStatus;
  reviewRequestedAt?: string | null;
  reviewCompletedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  changesRequested?: string | null;
  approvedFileUrl?: string | null;
  signedReviewLetterUrl?: string | null;
  attorneyEngagementFileUrl?: string | null;
  attorneyFeeAgreementFileUrl?: string | null;
  proposedAttorneyFeeType?: CompensationType | null;
  proposedAttorneyFeePercentage?: number | null;
  proposedAttorneyFlatFee?: number | null;
  attorneyFeeStatus: AttorneyFeeStatus;
  attorneyApprovalNotes?: string | null;
  attorneyReviewFileHtml?: string | null;
  uploads: AttorneyReviewUpload[];
  manualOverrideAcknowledged?: boolean;
  manualOverrideAt?: string | null;
  manualOverrideBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttorneyCompensation {
  id: string;
  organizationId: string;
  attorneyReviewId: string;
  leadId: string;
  compensationType: CompensationType;
  proposedPercentage?: number | null;
  proposedFlatFee?: number | null;
  proposedHourlyFee?: number | null;
  paidFromAssignmentFee: boolean;
  paymentDueCondition: PaymentDueCondition;
  writtenAgreementUploaded: boolean;
  agreementFileUrl?: string | null;
  status: AttorneyFeeStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedactionChecklistItem {
  id: string;
  label: string;
  complete: boolean;
}

export interface DistributionPacket {
  id: string;
  organizationId: string;
  leadId: string;
  sourcePacketId?: string | null;
  finalArchiveId?: string | null;
  attorneyReviewId?: string | null;
  packetType: DistributionPacketType;
  packetStatus: DistributionPacketStatus;
  packetVersion: number;
  redactionChecklist: RedactionChecklistItem[];
  attorneyReviewStatus?: string | null;
  userApprovalStatus: string;
  approvedToSendAt?: string | null;
  approvedBy?: string | null;
  hideInternalProfitNotes?: boolean;
  printableHtml: string;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDistribution {
  id: string;
  organizationId: string;
  leadId: string;
  distributionPacketId: string;
  recipientId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  attachmentUrls: string[];
  sendStatus: EmailSendStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  simulated: boolean;
  sentBy?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  userApprovedPreview: boolean;
  followUpScheduledAt?: string | null;
  distributionRecordArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalRecipient {
  id: string;
  organizationId: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  recipientType: RecipientType;
  marketArea?: string | null;
  buyerCriteria?: string | null;
  proofOfFundsStatus: string;
  contactPermissionStatus: string;
  lastContactedAt?: string | null;
  packetSentCount: number;
  responseStatus: RecipientResponseStatus;
  notes?: string | null;
  doNotContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionAuditLog {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  actionType: string;
  actionDescription: string;
  performedBy: string;
  relatedRecipientId?: string | null;
  relatedAttorneyReviewId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const ATTORNEY_REVIEW_STATUS_LABELS: Record<AttorneyReviewStatus, string> = {
  not_started: "Not Started",
  packet_ready_for_attorney: "Packet Ready for Attorney",
  sent_delivered_manually: "Sent / Delivered Manually",
  under_attorney_review: "Under Attorney Review",
  changes_requested: "Changes Requested",
  approved_with_notes: "Approved With Notes",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_documentation: "Needs More Documentation",
  attorney_engagement_missing: "Attorney Engagement Missing",
  fee_agreement_missing: "Fee Agreement Missing",
  archived: "Archived",
};

export const DISTRIBUTION_STATUS_LABELS: Record<DistributionPacketStatus, string> = {
  draft: "Draft",
  needs_attorney_review: "Needs Attorney Review",
  attorney_approved: "Attorney Approved",
  ready_for_user_review: "Ready for User Review",
  approved_to_send: "Approved to Send",
  sent: "Sent",
  buyer_interested: "Buyer Interested",
  buyer_declined: "Buyer Declined",
  follow_up_needed: "Follow-Up Needed",
  archived: "Archived",
};

export const ATTORNEY_FEE_WARNING =
  "Attorney compensation terms must be confirmed directly with the attorney and documented in a written agreement. EstateLeadOS only stores and tracks uploaded review records and does not create or validate legal fee agreements.";

export const COMPENSATION_TRACKING_WARNING =
  "EstateLeadOS does not recommend attorney compensation terms. Any attorney fee or percentage arrangement must be agreed to directly with the attorney and documented in writing. EstateLeadOS only tracks the agreement and related files; it does not validate legal enforceability.";

export const MANUAL_OVERRIDE_TEXT =
  "I understand that EstateLeadOS does not provide legal advice and that I am responsible for confirming all legal, title, disclosure, brokerage, assignment, and communication requirements before sharing this packet externally.";

export const DISTRIBUTION_TYPE_LABELS: Record<DistributionPacketType, string> = {
  buyer_opportunity: "Buyer Opportunity Packet",
  realtor_review: "Realtor Review Packet",
  investor_review: "Investor Review Packet",
  real_estate_company: "Real Estate Company Packet",
  title_company_review: "Title Company Review Packet",
};

export const DISTRIBUTION_PACKET_WARNING =
  "This packet is for opportunity review only. Confirm all records, ownership, title, disclosures, and assignment requirements with qualified professionals before proceeding.";

export const ATTORNEY_FEE_STATUS_LABELS: Record<AttorneyFeeStatus, string> = {
  not_discussed: "Not Discussed",
  proposed: "Proposed",
  awaiting_written_agreement: "Awaiting Written Agreement",
  written_agreement_uploaded: "Written Agreement Uploaded",
  approved_by_attorney: "Approved By Attorney",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
  not_applicable: "Not Applicable",
};

export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  not_set: "Not Set",
  flat_fee: "Flat Fee",
  hourly: "Hourly",
  contingent_percentage: "Contingent Percentage",
  hybrid: "Hybrid",
  other: "Other",
  not_applicable: "Not Applicable",
};

export const PAYMENT_DUE_CONDITION_LABELS: Record<PaymentDueCondition, string> = {
  due_now: "Due Now",
  due_after_review: "Due After Review",
  due_at_closing: "Due At Closing",
  due_from_assignment_fee_if_closing: "Due From Assignment Fee If Closing Occurs",
  other_written_agreement: "Other Written Agreement",
  not_set: "Not Set",
};

export const ATTORNEY_NO_FEE_RECOMMENDATION =
  "EstateLeadOS does not recommend attorney compensation percentages or fee amounts. Enter only terms discussed directly with your attorney.";
