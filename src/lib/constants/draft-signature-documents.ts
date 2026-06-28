import type { DraftSignatureDocumentStatus } from "@/lib/types/program";

export interface DraftSignatureTemplateDefinition {
  documentType: string;
  documentName: string;
  templateVersion: string;
  requiredFields: string[];
  attorneyReviewRequired: boolean;
  signatureRequired: boolean;
}

export const DRAFT_SIGNATURE_TEMPLATES: DraftSignatureTemplateDefinition[] = [
  {
    documentType: "seller_intake_form",
    documentName: "Seller Intake Form",
    templateVersion: "1.0",
    requiredFields: ["property_address", "owner_name", "seller_contact", "mailing_address"],
    attorneyReviewRequired: true,
    signatureRequired: true,
  },
  {
    documentType: "property_information_sheet",
    documentName: "Property Information Sheet",
    templateVersion: "1.0",
    requiredFields: ["property_address", "parcel_id", "county", "state", "property_type"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "owner_representative_verification",
    documentName: "Owner / Representative Verification Sheet",
    templateVersion: "1.0",
    requiredFields: ["owner_name", "representative_name", "government_evidence_citation"],
    attorneyReviewRequired: true,
    signatureRequired: true,
  },
  {
    documentType: "purchase_intent_worksheet",
    documentName: "Purchase Intent Worksheet",
    templateVersion: "1.0",
    requiredFields: ["property_address", "purchase_intent_summary", "offer_range"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "offer_worksheet",
    documentName: "Offer Worksheet",
    templateVersion: "1.0",
    requiredFields: ["property_address", "offer_amount", "estimated_arv", "estimated_repairs"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "assignability_review_checklist",
    documentName: "Assignability Review Checklist",
    templateVersion: "1.0",
    requiredFields: ["state", "county", "contract_assignability_notes"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "assignment_disclosure_checklist",
    documentName: "Assignment Disclosure Checklist",
    templateVersion: "1.0",
    requiredFields: ["state", "disclosure_requirements_acknowledged"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "buyer_assignee_disclosure_checklist",
    documentName: "Buyer / Assignee Disclosure Checklist",
    templateVersion: "1.0",
    requiredFields: ["buyer_name", "disclosure_language_reviewed"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "attorney_review_acknowledgement",
    documentName: "Attorney Review Acknowledgement",
    templateVersion: "1.0",
    requiredFields: ["attorney_name", "review_date"],
    attorneyReviewRequired: true,
    signatureRequired: true,
  },
  {
    documentType: "title_company_intake_sheet",
    documentName: "Title Company Intake Sheet",
    templateVersion: "1.0",
    requiredFields: ["property_address", "title_company_name", "parcel_id"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "fee_agreement_tracking_sheet",
    documentName: "Fee Agreement Tracking Sheet",
    templateVersion: "1.0",
    requiredFields: ["target_assignment_fee", "fee_structure_notes"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
  {
    documentType: "final_signing_checklist",
    documentName: "Final Signing Checklist",
    templateVersion: "1.0",
    requiredFields: ["attorney_approval_status", "documents_ready_for_signature"],
    attorneyReviewRequired: true,
    signatureRequired: false,
  },
];

export const DRAFT_FIELD_LABELS: Record<string, string> = {
  property_address: "Property Address",
  owner_name: "Owner Name",
  seller_contact: "Seller Contact",
  mailing_address: "Mailing Address",
  parcel_id: "Parcel ID",
  county: "County",
  state: "State",
  property_type: "Property Type",
  representative_name: "Representative Name",
  government_evidence_citation: "Government Evidence Citation",
  purchase_intent_summary: "Purchase Intent Summary",
  offer_range: "Offer Range",
  offer_amount: "Offer Amount",
  estimated_arv: "Estimated ARV",
  estimated_repairs: "Estimated Repairs",
  contract_assignability_notes: "Contract Assignability Notes",
  disclosure_requirements_acknowledged: "Disclosure Requirements Acknowledged",
  buyer_name: "Buyer Name",
  disclosure_language_reviewed: "Disclosure Language Reviewed",
  attorney_name: "Attorney Name",
  review_date: "Review Date",
  title_company_name: "Title Company Name",
  target_assignment_fee: "Target Assignment Fee",
  fee_structure_notes: "Fee Structure Notes",
  attorney_approval_status: "Attorney Approval Status",
  documents_ready_for_signature: "Documents Ready for Signature",
};

export function deriveDraftDocumentStatus(missingFields: string[]): DraftSignatureDocumentStatus {
  if (missingFields.length > 0) return "missing_data";
  return "ready_for_internal_review";
}
