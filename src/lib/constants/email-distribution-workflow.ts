export const EMAIL_DISTRIBUTION_WORKFLOW_STEPS = [
  { step: 1, key: "select_final_archive", label: "Select Final Archive File" },
  { step: 2, key: "select_packet_type", label: "Select Distribution Packet Type" },
  { step: 3, key: "select_recipient", label: "Select Recipient" },
  { step: 4, key: "confirm_not_dnc", label: "Confirm Recipient Is Not Do Not Contact" },
  { step: 5, key: "confirm_attorney", label: "Confirm Attorney Review / Override" },
  { step: 6, key: "confirm_compliance", label: "Confirm Compliance Blockers Clear" },
  { step: 7, key: "confirm_redaction", label: "Confirm Redaction Checklist" },
  { step: 8, key: "preview_email", label: "Preview Email" },
  { step: 9, key: "attach_packet", label: "Attach Packet" },
  { step: 10, key: "final_approval", label: "Final User Approval" },
  { step: 11, key: "send", label: "Send or Simulate Send" },
  { step: 12, key: "log_email", label: "Log Email" },
  { step: 13, key: "schedule_follow_up", label: "Schedule Follow-Up" },
  { step: 14, key: "archive_record", label: "Archive Distribution Record" },
] as const;

export type EmailWorkflowStepKey = (typeof EMAIL_DISTRIBUTION_WORKFLOW_STEPS)[number]["key"];

export const DISTRIBUTION_BRAND_FOOTER = "EstateLeadOS — Powered by SCS Nova";

export const NO_AUTO_SEND_NOTICE =
  "EstateLeadOS never auto-sends emails. Every send requires explicit user preview approval. No bulk blast. No buyer response or assignment fee guarantees.";

export const DISTRIBUTION_PACKET_TYPES = [
  "buyer_opportunity",
  "realtor_review",
  "investor_review",
  "real_estate_company",
  "title_company_review",
] as const;
