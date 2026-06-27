import type { RequiredDocumentStatus } from "@/lib/types/program";

export interface RequiredPacketItemDefinition {
  documentType: string;
  documentName: string;
  requiredForPacket: boolean;
  requiredForAssignmentReview: boolean;
  requiredForBuyerReview: boolean;
  whyItMatters: string;
  whereToLookNext: string;
}

export const REQUIRED_PACKET_ITEMS: RequiredPacketItemDefinition[] = [
  { documentType: "lead_summary", documentName: "Lead Summary", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Summarizes the government-record signal and proof chain status.", whereToLookNext: "Auto-generated from lead detail and pipeline stage." },
  { documentType: "property_research_sheet", documentName: "Property Research Sheet", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Confirms property address, parcel, and assessment match.", whereToLookNext: "County assessor, SDAT, or GIS parcel record." },
  { documentType: "government_evidence_sheet", documentName: "Government Source Evidence Sheet", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Every claim must cite an official government source.", whereToLookNext: "Evidence tab on lead detail." },
  { documentType: "probate_estate_sheet", documentName: "Probate / Estate Signal Sheet", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Documents inherited-property / estate signal from official records.", whereToLookNext: "Register of Wills, probate court, or estate filing." },
  { documentType: "property_assessment", documentName: "Property Assessment Record", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Official assessment confirms owner and property characteristics.", whereToLookNext: "State/county assessor or SDAT." },
  { documentType: "tax_record", documentName: "Tax Record", requiredForPacket: false, requiredForAssignmentReview: false, requiredForBuyerReview: false, whyItMatters: "Tax status may indicate ownership and delinquency.", whereToLookNext: "County tax office or treasurer." },
  { documentType: "deed_transfer_check", documentName: "Deed / Transfer Check", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Verifies ownership transfer history from land records.", whereToLookNext: "County recorder, MDLandRec, or deed index." },
  { documentType: "gis_parcel_visual", documentName: "GIS / Parcel Visual", requiredForPacket: true, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Official parcel map with attribution.", whereToLookNext: "County GIS or assessor map portal." },
  { documentType: "property_visual", documentName: "Property Photo / Map / Visual Source", requiredForPacket: true, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Visual context for property review.", whereToLookNext: "County GIS photo, parcel map, or static map fallback." },
  { documentType: "responsible_party_sheet", documentName: "Possible Responsible Party / Representative Sheet", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Links decedent to personal representative from official estate source.", whereToLookNext: "Probate filing or register of wills record." },
  { documentType: "contact_candidate_sheet", documentName: "Contact Candidate Sheet", requiredForPacket: true, requiredForAssignmentReview: false, requiredForBuyerReview: false, whyItMatters: "Separates unverified contact enrichment from verified proof.", whereToLookNext: "Official mailing address on estate or tax record only for verification." },
  { documentType: "compliance_checklist", documentName: "Compliance Checklist", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "State/county compliance requirements before outreach or assignment.", whereToLookNext: "State Deal Kit and Compliance Center." },
  { documentType: "outreach_readiness", documentName: "Outreach Readiness Checklist", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Confirms manual approval before any seller contact.", whereToLookNext: "Outreach Center — manual approval required." },
  { documentType: "assignment_readiness", documentName: "Assignment Readiness Checklist", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Prepares assignment-fee strategy review materials.", whereToLookNext: "Assignment Tracker and attorney/title review." },
  { documentType: "buyer_opportunity_sheet", documentName: "Buyer / Investor Opportunity Sheet", requiredForPacket: false, requiredForAssignmentReview: false, requiredForBuyerReview: true, whyItMatters: "Buyer-facing opportunity summary — manual share only.", whereToLookNext: "Deal calculator and buyer match." },
  { documentType: "deal_calculator_printout", documentName: "Deal Calculator Printout", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "ARV, repair, spread, and fee estimates for review.", whereToLookNext: "Deal Calculator on lead detail." },
  { documentType: "missing_documents_report", documentName: "Missing Documents Report", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Lists gaps — never pretends missing documents exist.", whereToLookNext: "Document Finder results." },
  { documentType: "manual_approval_record", documentName: "Manual Approval Record", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Records operator approval before verification or outreach.", whereToLookNext: "Review Queue or lead verification tab." },
  { documentType: "audit_trail_summary", documentName: "Audit Trail Summary", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: false, whyItMatters: "Who did what, when, with which sources.", whereToLookNext: "Audit Trail and pipeline events." },
  { documentType: "final_review_cover", documentName: "Final Review Cover Sheet", requiredForPacket: true, requiredForAssignmentReview: true, requiredForBuyerReview: true, whyItMatters: "Cover page for printable packet with disclaimers.", whereToLookNext: "Auto-generated on packet build." },
];

export function defaultRequiredStatus(): RequiredDocumentStatus {
  return "not_started";
}
