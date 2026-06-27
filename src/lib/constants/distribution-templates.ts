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
  { id: "internal_notes", label: "Remove internal notes" },
  { id: "rejected_sources", label: "Remove rejected sources" },
  { id: "rejected_contacts", label: "Remove rejected contact candidates" },
  { id: "attorney_private", label: "Remove attorney-private notes" },
  { id: "buyer_disclosure", label: "Confirm buyer-facing disclosure language" },
  { id: "assignment_language", label: "Confirm assignment/equitable-interest language" },
  { id: "attorney_status", label: "Confirm attorney review status" },
  { id: "contact_instructions", label: "Confirm contact instructions" },
  { id: "no_unsupported", label: "Confirm no unsupported claims" },
  { id: "no_guarantees", label: "Confirm no legal guarantees" },
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
  attorney_fee_agreement: "Attorney Fee Agreement",
  attorney_engagement_agreement: "Attorney Engagement Agreement",
  title_company_notes: "Title Company Notes",
  disclosure_checklist: "Disclosure Checklist",
  revised_buyer_packet: "Revised Buyer Packet",
  revised_assignment_packet: "Revised Assignment Packet",
  other_review_document: "Other Review Document",
};
