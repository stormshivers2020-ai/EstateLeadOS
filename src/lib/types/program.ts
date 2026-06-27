export type ProgramAutomationMode = "manual" | "assisted" | "supervised" | "full_automation";

export type RequiredDocumentStatus =
  | "not_started"
  | "found"
  | "attached"
  | "missing"
  | "needs_manual_research"
  | "needs_upload"
  | "needs_review"
  | "approved"
  | "rejected"
  | "not_applicable";

export type LeadPacketType =
  | "internal_review"
  | "seller_outreach_prep"
  | "buyer_investor_opportunity"
  | "assignment_readiness"
  | "attorney_title_review"
  | "full_lead_archive";

export type LeadPacketStatus =
  | "draft"
  | "review_needed"
  | "missing_documents"
  | "compliance_blocked"
  | "ready_for_internal_review"
  | "ready_for_seller_outreach_review"
  | "ready_for_buyer_review"
  | "assignment_review_ready"
  | "archived"
  | "rejected";

export type ArchiveStatus =
  | "all_packets"
  | "ready_for_review"
  | "missing_documents"
  | "compliance_blocked"
  | "buyer_review_ready"
  | "assignment_review_ready"
  | "archived_closed"
  | "rejected"
  | "needs_manual_research";

export type AssignmentReadinessStatus =
  | "not_started"
  | "research_only"
  | "outreach_prep"
  | "seller_review"
  | "offer_review"
  | "under_contract_pending_review"
  | "buyer_match_review"
  | "assignment_packet_draft"
  | "assignment_review_needed"
  | "title_review_needed"
  | "closing_review"
  | "fee_recorded"
  | "payout_readiness_review"
  | "closed_archived"
  | "rejected";

export type ReviewQueueType =
  | "leads_ready_for_manual_review"
  | "packets_ready_to_print"
  | "missing_documents"
  | "compliance_blockers"
  | "assignment_review_needed"
  | "buyer_review_ready"
  | "payout_readiness_review"
  | "rejected_bad_match"
  | "needs_manual_research";

export type ProgramRunAction =
  | "find_government_leads"
  | "complete_research"
  | "find_missing_documents"
  | "build_printable_packets"
  | "prepare_assignment_readiness"
  | "match_buyers"
  | "archive_packets"
  | "full_lead_to_packet_workflow";

export interface RequiredDocument {
  id: string;
  organizationId: string;
  leadId: string;
  documentType: string;
  documentName: string;
  status: RequiredDocumentStatus;
  sourceName?: string | null;
  sourceUrl?: string | null;
  evidenceSourceId?: string | null;
  uploadedFileUrl?: string | null;
  requiredForPacket: boolean;
  requiredForAssignmentReview: boolean;
  requiredForBuyerReview: boolean;
  whyItMatters?: string | null;
  whereToLookNext?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPacketSection {
  id: string;
  packetId: string;
  sectionType: string;
  sectionTitle: string;
  sectionStatus: RequiredDocumentStatus;
  sectionContent: string;
  sourceEvidenceIds: string[];
  missingItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadPacket {
  id: string;
  organizationId: string;
  leadId: string;
  packetType: LeadPacketType;
  packetStatus: LeadPacketStatus;
  packetVersion: number;
  generatedBy: string;
  generatedAt: string;
  archivedAt?: string | null;
  printableHtml: string;
  pdfUrl?: string | null;
  archiveUrl?: string | null;
  confidenceScore: number;
  verificationStatus: string;
  complianceStatus: string;
  assignmentReadinessStatus: AssignmentReadinessStatus;
  buyerReviewStatus: string;
  payoutReadinessStatus: string;
  notes?: string | null;
  sections: LeadPacketSection[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadArchive {
  id: string;
  organizationId: string;
  leadId: string;
  packetId: string;
  archiveStatus: ArchiveStatus;
  archiveType: LeadPacketType;
  archivedBy: string;
  archivedAt: string;
  archiveNotes?: string | null;
  printCount: number;
  lastPrintedAt?: string | null;
  countyName?: string | null;
  stateAbbr?: string | null;
  confidenceScore: number;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentReadiness {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  status: AssignmentReadinessStatus;
  targetAssignmentFee?: number | null;
  minimumAcceptableSpread?: number | null;
  buyerMatchId?: string | null;
  buyerProofOfFundsStatus: string;
  titleCompanyStatus: string;
  disclosureChecklistStatus: string;
  attorneyReviewStatus: string;
  signedDocumentStatus: string;
  complianceBlockersClear: boolean;
  payoutReadinessStatus: string;
  checklist: Array<{ id: string; label: string; complete: boolean; required: boolean }>;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  organizationId: string;
  leadId: string;
  packetId?: string | null;
  queueType: ReviewQueueType;
  priority: number;
  status: string;
  assignedTo?: string | null;
  nextAction: string;
  blockerCount: number;
  missingDocumentCount: number;
  countyName?: string | null;
  stateAbbr?: string | null;
  currentStage?: string | null;
  confidenceScore?: number | null;
  packetStatus?: string | null;
  leadTitle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PacketPrintLog {
  id: string;
  organizationId: string;
  leadId: string;
  packetId: string;
  printedBy: string;
  printedAt: string;
  printType: string;
  notes?: string | null;
}

export const PACKET_TYPE_LABELS: Record<LeadPacketType, string> = {
  internal_review: "Internal Review Packet",
  seller_outreach_prep: "Seller Outreach Preparation Packet",
  buyer_investor_opportunity: "Buyer / Investor Opportunity Packet",
  assignment_readiness: "Assignment Readiness Packet",
  attorney_title_review: "Attorney / Title Review Packet",
  full_lead_archive: "Full Lead Archive Packet",
};

export const PACKET_STATUS_LABELS: Record<LeadPacketStatus, string> = {
  draft: "Draft",
  review_needed: "Review Needed",
  missing_documents: "Missing Documents",
  compliance_blocked: "Compliance Blocked",
  ready_for_internal_review: "Ready for Internal Review",
  ready_for_seller_outreach_review: "Ready for Seller Outreach Review",
  ready_for_buyer_review: "Ready for Buyer Review",
  assignment_review_ready: "Assignment Review Ready",
  archived: "Archived",
  rejected: "Rejected",
};

export const REVIEW_QUEUE_LABELS: Record<ReviewQueueType, string> = {
  leads_ready_for_manual_review: "Leads Ready for Manual Review",
  packets_ready_to_print: "Packets Ready to Print",
  missing_documents: "Missing Documents",
  compliance_blockers: "Compliance Blockers",
  assignment_review_needed: "Assignment Review Needed",
  buyer_review_ready: "Buyer Review Ready",
  payout_readiness_review: "Payout Readiness Review",
  rejected_bad_match: "Rejected / Bad Match",
  needs_manual_research: "Needs Manual Research",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentReadinessStatus, string> = {
  not_started: "Not Started",
  research_only: "Research Only",
  outreach_prep: "Outreach Prep",
  seller_review: "Seller Review",
  offer_review: "Offer Review",
  under_contract_pending_review: "Under Contract Pending Review",
  buyer_match_review: "Buyer Match Review",
  assignment_packet_draft: "Assignment Packet Draft",
  assignment_review_needed: "Assignment Review Needed",
  title_review_needed: "Title Review Needed",
  closing_review: "Closing Review",
  fee_recorded: "Fee Recorded",
  payout_readiness_review: "Payout Readiness Review",
  closed_archived: "Closed / Archived",
  rejected: "Rejected",
};

export const BUYER_PACKET_WARNING =
  "This packet is for opportunity review only. Confirm all records, ownership, title, disclosures, and assignment requirements with qualified professionals before proceeding.";

export const PROGRAM_RUN_OPTIONS: Array<{ id: ProgramRunAction; label: string; description: string }> = [
  { id: "find_government_leads", label: "Find new government leads", description: "Search approved government/public-record sources for inherited-property signals" },
  { id: "complete_research", label: "Complete research for existing leads", description: "Continue proof chain research for leads already in the pipeline" },
  { id: "find_missing_documents", label: "Find missing documents", description: "Run Document Finder and identify gaps in required packet items" },
  { id: "build_printable_packets", label: "Build printable packets", description: "Generate review-ready printable packets with citations and checklists" },
  { id: "prepare_assignment_readiness", label: "Prepare assignment-readiness review", description: "Build assignment-readiness checklist and review materials" },
  { id: "match_buyers", label: "Match buyers/investors", description: "Prepare buyer/investor opportunity materials for manual review" },
  { id: "archive_packets", label: "Archive completed packets", description: "Version and store completed packets in the archive" },
  { id: "full_lead_to_packet_workflow", label: "Run full lead-to-packet workflow", description: "End-to-end: discover → research → documents → packet → archive (stops at approval gates)" },
];
