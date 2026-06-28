import type { ArchiveStage, ArchiveTabId } from "@/lib/types/program";

export const ARCHIVE_BRAND_FOOTER = "EstateLeadOS — Powered by SCS Nova";

export const ARCHIVE_STAGE_LABELS: Record<ArchiveStage, string> = {
  initial_review: "Initial Review Archive",
  final_attorney_reviewed: "Final Attorney-Reviewed Archive",
};

export const ARCHIVE_TAB_LABELS: Record<ArchiveTabId, string> = {
  initial_review: "Initial Review Archive",
  final_attorney_reviewed: "Final Attorney-Reviewed Archive",
  all: "All Archived Files",
  ready_to_print: "Ready to Print",
  ready_for_attorney: "Ready for Attorney",
  attorney_reviewed: "Attorney Reviewed",
  final_approved: "Final Approved",
  rejected_superseded: "Rejected / Superseded",
};

export const ARCHIVE_TAB_ORDER: ArchiveTabId[] = [
  "initial_review",
  "final_attorney_reviewed",
  "all",
  "ready_to_print",
  "ready_for_attorney",
  "attorney_reviewed",
  "final_approved",
  "rejected_superseded",
];

/** Archive 1 — stored before attorney review */
export const INITIAL_ARCHIVE_FILE_CATEGORIES = [
  "original_acquisition_packet",
  "internal_review_packet",
  "government_proof_chain",
  "source_citations",
  "property_visuals",
  "draft_signature_documents",
  "missing_document_report",
  "first_print_record",
  "deal_calculator_printout",
  "assignment_readiness_checklist",
  "audit_summary",
] as const;

/** Archive 2 — attorney-reviewed / final documents */
export const FINAL_ARCHIVE_FILE_CATEGORIES = [
  "attorney_reviewed_packet",
  "attorney_approval_notes",
  "attorney_redlines",
  "signed_revised_documents",
  "attorney_engagement_agreement",
  "attorney_fee_agreement",
  "title_company_notes",
  "final_distribution_packet",
  "final_disclosure_checklist",
  "final_assignment_readiness",
  "final_print_record",
  "final_audit_trail",
] as const;

export const ARCHIVE_FILE_CATEGORY_LABELS: Record<string, string> = {
  original_acquisition_packet: "Original Acquisition Packet",
  internal_review_packet: "Internal Review Packet",
  government_proof_chain: "Government Proof Chain",
  source_citations: "Source Citations",
  property_visuals: "Property Visuals",
  draft_signature_documents: "Draft Signature Documents",
  missing_document_report: "Missing Document Report",
  first_print_record: "First Print Record",
  deal_calculator_printout: "Deal Calculator Printout",
  assignment_readiness_checklist: "Assignment Readiness Checklist",
  audit_summary: "Audit Summary",
  attorney_reviewed_packet: "Attorney-Reviewed Packet",
  attorney_approval_notes: "Attorney Approval Notes",
  attorney_redlines: "Attorney Redlines",
  signed_revised_documents: "Signed / Revised Documents",
  attorney_engagement_agreement: "Attorney Engagement Agreement",
  attorney_fee_agreement: "Attorney Fee Agreement",
  title_company_notes: "Title Company Notes",
  final_distribution_packet: "Final Buyer / Realtor Distribution Packet",
  final_disclosure_checklist: "Final Approved Disclosure Checklist",
  final_assignment_readiness: "Final Assignment Readiness File",
  final_print_record: "Final Print / Export Record",
  final_audit_trail: "Final Audit Trail",
  printable_html_snapshot: "Printable HTML Snapshot",
};

export const INITIAL_ARCHIVE_DISCLAIMER =
  "Initial Review Archive stores the original system-generated packet before attorney review. Not legal approval.";

export const FINAL_ARCHIVE_DISCLAIMER =
  "Final Attorney-Reviewed Archive stores attorney-reviewed, signed, and approved files separately from the initial review archive. Not legal approval.";
