import type { RequiredDocumentStatus } from "@/lib/types/program";

export interface RequiredPacketItemDefinition {
  documentType: string;
  documentName: string;
  requiredForPacket: boolean;
  requiredForAttorneyReview: boolean;
  requiredForAssignmentReview: boolean;
  requiredForBuyerReview: boolean;
  whyItMatters: string;
  whereToLookNext: string;
}

/** Phase 2 — government proof discovery items (13 required checks per lead). */
export const GOVERNMENT_PROOF_DOCUMENT_TYPES = [
  "lead_summary",
  "government_evidence_sheet",
  "probate_estate_sheet",
  "property_assessment",
  "tax_record",
  "deed_transfer_check",
  "gis_parcel_visual",
  "property_visual",
  "responsible_party_sheet",
  "contact_candidate_sheet",
  "source_citation_sheet",
  "missing_documents_report",
  "manual_approval_record",
] as const;

export type GovernmentProofDocumentType = (typeof GOVERNMENT_PROOF_DOCUMENT_TYPES)[number];

export const REQUIRED_DOCUMENT_STATUS_LABELS: Record<RequiredDocumentStatus, string> = {
  not_started: "Not Started",
  found: "Found",
  attached: "Attached",
  missing: "Missing",
  needs_manual_research: "Needs Manual Research",
  needs_upload: "Needs Upload",
  needs_review: "Needs Review",
  approved: "Approved",
  rejected: "Rejected",
  not_applicable: "Not Applicable",
};

export const REQUIRED_PACKET_ITEMS: RequiredPacketItemDefinition[] = [
  { documentType: "lead_summary", documentName: "Lead Summary", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Summarizes the government-record signal and proof chain status.", whereToLookNext: "Auto-generated from lead detail and proof chain." },
  { documentType: "property_research_sheet", documentName: "Property Research Sheet", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Confirms property address, parcel, and assessment match.", whereToLookNext: "County assessor, SDAT, or GIS parcel record." },
  { documentType: "government_evidence_sheet", documentName: "Government Signal Evidence", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Official government/public-record signal that started the lead.", whereToLookNext: "County/state open data, court, or register of wills." },
  { documentType: "probate_estate_sheet", documentName: "Estate / Probate Signal Evidence", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Documents inherited-property / estate signal from official records only.", whereToLookNext: "Register of Wills, probate court, or estate filing." },
  { documentType: "property_assessment", documentName: "Property Assessment Record", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Official assessment confirms owner and property characteristics.", whereToLookNext: "State/county assessor or SDAT." },
  { documentType: "tax_record", documentName: "Tax Record", requiredForPacket: false, requiredForAttorneyReview: false, requiredForAssignmentReview: false, requiredForBuyerReview: false, whyItMatters: "Tax status may indicate ownership and delinquency when available.", whereToLookNext: "County tax office or treasurer." },
  { documentType: "deed_transfer_check", documentName: "Deed / Transfer Check", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Verifies ownership transfer history from land records.", whereToLookNext: "County recorder, MDLandRec, or deed index." },
  { documentType: "gis_parcel_visual", documentName: "GIS / Parcel Map", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Official parcel map with attribution.", whereToLookNext: "County GIS or assessor map portal." },
  { documentType: "property_visual", documentName: "Property Photo / Visual", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Visual context from official GIS/assessor sources.", whereToLookNext: "County GIS photo, parcel map, or assessor visual." },
  { documentType: "responsible_party_sheet", documentName: "Possible Representative Sheet", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Links decedent to personal representative from official estate source.", whereToLookNext: "Probate filing or register of wills record." },
  { documentType: "contact_candidate_sheet", documentName: "Contact Candidate Sheet", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: false, requiredForBuyerReview: false, whyItMatters: "Low-confidence contact enrichment — separate from verified government proof.", whereToLookNext: "Official mailing on estate/tax record only; never people-search as proof." },
  { documentType: "source_citation_sheet", documentName: "Source Citation Sheet", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Every claim must cite an official government source.", whereToLookNext: "Evidence tab — copy citations from source cards." },
  { documentType: "compliance_checklist", documentName: "Compliance Checklist", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "State/county compliance requirements before outreach or assignment.", whereToLookNext: "State Deal Kit and Compliance Center." },
  { documentType: "outreach_readiness", documentName: "Outreach Readiness Checklist", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Confirms manual approval before any seller contact.", whereToLookNext: "Outreach Center — manual approval required." },
  { documentType: "assignment_readiness", documentName: "Assignment Readiness Checklist", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Prepares assignment-fee strategy review materials.", whereToLookNext: "Assignment Tracker and attorney/title review." },
  { documentType: "buyer_opportunity_sheet", documentName: "Buyer / Investor Opportunity Sheet", requiredForPacket: false, requiredForAttorneyReview: false, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Buyer-facing opportunity summary — manual share only.", whereToLookNext: "Deal calculator and buyer match." },
  { documentType: "deal_calculator_printout", documentName: "Deal Calculator Printout", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "ARV, repair, spread, and fee estimates for review.", whereToLookNext: "Deal Calculator on lead detail." },
  { documentType: "missing_documents_report", documentName: "Missing Documents Report", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Lists gaps — never pretends missing documents exist.", whereToLookNext: "Run document discovery on Evidence tab." },
  { documentType: "manual_approval_record", documentName: "Manual Approval Record", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Records operator approval before verification or outreach — not legal approval.", whereToLookNext: "Review Queue or Evidence tab manual review step." },
  { documentType: "audit_trail_summary", documentName: "Audit Trail Summary", requiredForPacket: true, requiredForAttorneyReview: false, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Who did what, when, with which sources.", whereToLookNext: "Audit Trail and pipeline events." },
  { documentType: "final_review_cover", documentName: "Final Review Cover Sheet", requiredForPacket: true, requiredForAttorneyReview: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Cover page for printable packet with disclaimers.", whereToLookNext: "Auto-generated on packet build." },
];

export function getGovernmentProofItems(): RequiredPacketItemDefinition[] {
  return REQUIRED_PACKET_ITEMS.filter((item) =>
    (GOVERNMENT_PROOF_DOCUMENT_TYPES as readonly string[]).includes(item.documentType)
  );
}

export function defaultRequiredStatus(): RequiredDocumentStatus {
  return "not_started";
}

export const INVALID_PROOF_SOURCE_NOTE =
  "Invalid for lead proof: listing sites (Zillow, Realtor, Redfin), investor lead sellers, people-search sites, blogs, and SEO pages. Contact enrichment may be saved separately but cannot verify a lead.";

export const GOVERNMENT_PROOF_DISCLAIMER =
  "EstateLeadOS — Powered by SCS Nova — uses official government/public-record sources only for lead proof. Manual review is required before the lead moves forward. EstateLeadOS does not auto-contact anyone and does not provide legal advice.";
