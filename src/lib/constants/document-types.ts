import type { DocumentTypeDefinition } from "@/lib/types/documents";

const base = (overrides: Partial<DocumentTypeDefinition> & Pick<DocumentTypeDefinition, "id" | "name" | "category" | "description">): DocumentTypeDefinition => ({
  requirementLogic: "conditional",
  stateSpecific: false,
  countySpecific: false,
  dealTypeSpecific: true,
  workflowStageSpecific: true,
  attorneyReviewFlag: false,
  signatureNeededFlag: false,
  uploadAllowed: true,
  generateAllowed: true,
  versionRequired: true,
  disclaimerRequired: true,
  auditRequired: true,
  ...overrides,
});

export const DOCUMENT_TYPE_DEFINITIONS: DocumentTypeDefinition[] = [
  base({ id: "seller_intake_form", name: "Seller intake form", category: "seller_documents", description: "Workflow intake form for seller/owner information", signatureNeededFlag: true, stateSpecific: true }),
  base({ id: "owner_heir_verification", name: "Owner/heir verification checklist", category: "compliance_documents", description: "Checklist to verify owner or heir authority", stateSpecific: true, requirementLogic: "required_before_stage" }),
  base({ id: "property_research_worksheet", name: "Property research worksheet", category: "internal_worksheets", description: "Property condition and market research worksheet" }),
  base({ id: "probate_status_checklist", name: "Probate status checklist", category: "compliance_documents", description: "Probate case status verification checklist", attorneyReviewFlag: true, stateSpecific: true }),
  base({ id: "lead_source_record", name: "Lead source record", category: "source_records", description: "Record of data sources used for this lead", requirementLogic: "required" }),
  base({ id: "purchase_offer_worksheet", name: "Purchase offer worksheet", category: "internal_worksheets", description: "Offer calculation worksheet — not a binding contract" }),
  base({ id: "repair_estimate_worksheet", name: "Repair estimate worksheet", category: "internal_worksheets", description: "Estimated repair cost worksheet" }),
  base({ id: "comparable_sales_worksheet", name: "Comparable sales worksheet", category: "internal_worksheets", description: "Comparable sales analysis worksheet" }),
  base({ id: "max_allowable_offer_worksheet", name: "Max allowable offer worksheet", category: "internal_worksheets", description: "Maximum offer calculation worksheet" }),
  base({ id: "purchase_agreement_checklist", name: "Purchase agreement checklist", category: "seller_documents", description: "CHECKLIST ONLY — not a purchase agreement. Review with attorney.", attorneyReviewFlag: true, stateSpecific: true, generateAllowed: true }),
  base({ id: "assignment_disclosure_checklist", name: "Assignment disclosure checklist", category: "compliance_documents", description: "Assignment disclosure requirements checklist", attorneyReviewFlag: true, stateSpecific: true }),
  base({ id: "seller_disclosure_ack", name: "Seller disclosure acknowledgement", category: "seller_documents", description: "Workflow acknowledgement template — not legal advice", signatureNeededFlag: true, stateSpecific: true }),
  base({ id: "buyer_assignee_disclosure_ack", name: "Buyer/assignee disclosure acknowledgement", category: "buyer_assignee_documents", description: "Workflow acknowledgement — not legal advice", signatureNeededFlag: true, attorneyReviewFlag: true }),
  base({ id: "assignment_agreement_checklist", name: "Assignment agreement checklist", category: "buyer_assignee_documents", description: "CHECKLIST ONLY — not an assignment contract. Attorney review required.", attorneyReviewFlag: true, stateSpecific: true }),
  base({ id: "title_company_intake", name: "Title company intake sheet", category: "title_company_documents", description: "Title company intake information sheet" }),
  base({ id: "proof_of_funds_record", name: "Proof of funds record", category: "buyer_assignee_documents", description: "Proof of funds documentation record", uploadAllowed: true }),
  base({ id: "buyer_profile_sheet", name: "Buyer profile sheet", category: "buyer_assignee_documents", description: "Buyer disposition profile worksheet" }),
  base({ id: "deal_memo", name: "Deal memo", category: "internal_worksheets", description: "Internal deal summary memo" }),
  base({ id: "closing_checklist", name: "Closing checklist", category: "title_company_documents", description: "Closing workflow checklist", stateSpecific: true }),
  base({ id: "communication_log_export", name: "Communication log export", category: "audit_documents", description: "Exported communication history for audit" }),
  base({ id: "compliance_acknowledgement", name: "Compliance acknowledgement", category: "compliance_documents", description: "User compliance acknowledgement — not legal advice", signatureNeededFlag: true, stateSpecific: true }),
  base({ id: "attorney_review_confirmation", name: "Attorney review confirmation", category: "compliance_documents", description: "Attorney/title review tracking — not legal approval", attorneyReviewFlag: true, signatureNeededFlag: true }),
  base({ id: "state_risk_acknowledgement", name: "State risk acknowledgement", category: "compliance_documents", description: "State-specific risk acknowledgement", signatureNeededFlag: true, stateSpecific: true }),
  base({ id: "source_document_packet", name: "Source document packet", category: "source_records", description: "Compiled source records for this lead", generateAllowed: false, uploadAllowed: true }),
];

export const DOCUMENT_TYPES = DOCUMENT_TYPE_DEFINITIONS;

export function getDocumentType(id: string): DocumentTypeDefinition | undefined {
  return DOCUMENT_TYPE_DEFINITIONS.find((d) => d.id === id);
}
