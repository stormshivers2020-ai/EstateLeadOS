export const ATTORNEY_REVIEW_QUESTIONS = [
  "Is the current proof packet sufficient for review?",
  "Are any ownership/title records missing?",
  "Are any disclosures required before contacting seller or buyer?",
  "Is the assignment structure acceptable for this state/county?",
  "Does the purchase/intent agreement need specific assignability language?",
  "Are there brokerage/licensing concerns?",
  "Are there advertising/marketing restrictions?",
  "Are there estate/probate-specific concerns?",
  "Are there title company requirements?",
  "What documents must be revised before external sharing?",
  "What documents must be signed before buyer distribution?",
  "What language should be included in the buyer/realtor packet?",
  "What should not be shared externally?",
];

export const REDACTION_CHECKLIST = [
  { id: "internal_notes", label: "Internal notes removed" },
  { id: "attorney_private", label: "Attorney-private notes removed or approved" },
  { id: "rejected_sources", label: "Rejected sources removed" },
  { id: "rejected_contacts", label: "Rejected contact candidates removed" },
  { id: "no_unsupported", label: "Unsupported claims removed" },
  { id: "buyer_disclosure", label: "Buyer-facing disclosure language reviewed" },
  { id: "assignment_language", label: "Assignment/equitable-interest language reviewed" },
  { id: "attorney_status", label: "Attorney review status confirmed" },
  { id: "contact_instructions", label: "Contact instructions confirmed" },
  { id: "no_guarantees", label: "No legal guarantees included" },
  { id: "no_profit_guarantees", label: "No profit guarantees included" },
];

export const EMAIL_TEMPLATES = [
  {
    id: "buyer_opportunity",
    category: "Buyer Opportunity Introduction",
    subject: "Property Opportunity Review — {{property_address}}",
    body: `Hello {{recipient_name}},

I'm sharing a review packet for a potential property opportunity at {{property_address}}.

The packet includes public-record research, property summary information, estimated deal assumptions, and review notes. Please review the materials and confirm whether this fits your current buying criteria.

This packet is for opportunity review only. All ownership, title, assignment, disclosure, and closing requirements should be confirmed with the appropriate professionals before proceeding.

Thank you,
{{sender_name}}`,
  },
  {
    id: "realtor_review",
    category: "Realtor Review Request",
    subject: "Property Review Request — {{property_address}}",
    body: `Hello {{recipient_name}},

Please review the attached opportunity packet for {{property_address}}. It includes public-record evidence summaries and estimated assumptions for your professional review.

This packet is for opportunity review only and does not constitute legal approval or ownership confirmation.

Thank you,
{{sender_name}}`,
  },
  {
    id: "investor_review",
    category: "Investor Review Request",
    subject: "Investor Opportunity Packet — {{property_address}}",
    body: `Hello {{recipient_name}},

Attached is an investor review packet for {{property_address}} with public-record summaries, property visuals, and user-entered deal assumptions.

Please confirm whether this opportunity fits your buy box. No profit, closing, or assignment outcomes are guaranteed.

Thank you,
{{sender_name}}`,
  },
  {
    id: "follow_up",
    category: "Follow-Up",
    subject: "Follow-Up: Property Opportunity — {{property_address}}",
    body: `Hello {{recipient_name}},

Following up on the opportunity packet for {{property_address}}. Please let me know if you need additional information or would like to schedule a review call.

Thank you,
{{sender_name}}`,
  },
  {
    id: "attorney_approved",
    category: "Attorney-Approved Packet Delivery",
    subject: "Review Packet — {{property_address}}",
    body: `Hello {{recipient_name}},

Please find the attached review packet for {{property_address}}. Materials have been prepared for external review with attorney review notes where applicable.

This packet is for opportunity review only. Confirm all title, disclosure, and assignment requirements with qualified professionals before proceeding.

Thank you,
{{sender_name}}`,
  },
];

export const UPLOAD_CATEGORY_LABELS: Record<string, string> = {
  attorney_reviewed_packet: "Attorney Reviewed Packet",
  attorney_approval_letter: "Attorney Approval Letter",
  attorney_redlines: "Attorney Redlines",
  attorney_comments: "Attorney Comments",
  attorney_fee_agreement: "Attorney Fee Agreement",
  attorney_engagement_agreement: "Attorney Engagement Agreement",
  title_company_notes: "Title Company Notes",
  revised_draft_documents: "Revised Draft Documents",
  signed_documents: "Signed Documents",
  disclosure_checklist: "Disclosure Checklist",
  revised_buyer_packet: "Revised Buyer Packet",
  revised_assignment_packet: "Revised Assignment Packet",
  other_review_document: "Other Review Document",
};

export const ATTORNEY_REVIEW_WORKFLOW_STEPS = [
  { step: 1, label: "Select packet for attorney review", key: "select_packet" },
  { step: 2, label: "Add attorney information", key: "attorney_info" },
  { step: 3, label: "Print or export attorney review packet", key: "print_export" },
  { step: 4, label: "Track delivery to attorney", key: "delivery" },
  { step: 5, label: "Track attorney comments", key: "comments" },
  { step: 6, label: "Track changes requested", key: "changes" },
  { step: 7, label: "Track attorney approval status", key: "approval" },
  { step: 8, label: "Track fee / percentage agreement", key: "fee_agreement" },
  { step: 9, label: "Upload attorney-reviewed file", key: "upload_reviewed" },
  { step: 10, label: "Upload signed attorney fee agreement if applicable", key: "upload_fee_agreement" },
  { step: 11, label: "Update document statuses", key: "document_statuses" },
  { step: 12, label: "Move reviewed files to Final Archive", key: "final_archive" },
] as const;
