import type { DocumentVariable } from "@/lib/types/documents";

export const DOCUMENT_VARIABLES: DocumentVariable[] = [
  { id: "v1", variableName: "user_company_name", label: "Company Name", description: "User organization name", sourceModule: "organization", sourceField: "name", required: false, fallbackAllowed: true },
  { id: "v2", variableName: "user_name", label: "User Name", description: "Current user full name", sourceModule: "user", sourceField: "fullName", required: false, fallbackAllowed: true },
  { id: "v3", variableName: "business_phone", label: "Business Phone", description: "Business phone number", sourceModule: "organization", sourceField: "phone", required: false, fallbackAllowed: true },
  { id: "v4", variableName: "business_email", label: "Business Email", description: "Business email address", sourceModule: "organization", sourceField: "email", required: false, fallbackAllowed: true },
  { id: "v5", variableName: "property_address", label: "Property Address", description: "Full property address", sourceModule: "lead", sourceField: "propertyAddress", required: true, fallbackAllowed: false },
  { id: "v6", variableName: "owner_name", label: "Owner Name", description: "Current owner name", sourceModule: "lead", sourceField: "ownerName", required: true, fallbackAllowed: false },
  { id: "v7", variableName: "possible_heir_name", label: "Possible Heir", description: "Possible heir or new owner", sourceModule: "lead", sourceField: "possibleHeirName", required: false, fallbackAllowed: true },
  { id: "v8", variableName: "mailing_address", label: "Mailing Address", description: "Owner mailing address", sourceModule: "lead", sourceField: "mailingAddress", required: false, fallbackAllowed: true },
  { id: "v9", variableName: "state", label: "State", description: "Property state", sourceModule: "lead", sourceField: "state", required: true, fallbackAllowed: false },
  { id: "v10", variableName: "county", label: "County", description: "Property county", sourceModule: "lead", sourceField: "county", required: true, fallbackAllowed: false },
  { id: "v11", variableName: "parcel_id", label: "Parcel ID", description: "Tax parcel identifier", sourceModule: "lead", sourceField: "parcelId", required: false, fallbackAllowed: true },
  { id: "v12", variableName: "lead_type", label: "Lead Type", description: "Primary lead classification", sourceModule: "lead", sourceField: "primaryLeadType", required: false, fallbackAllowed: true },
  { id: "v13", variableName: "estate_lead_score", label: "Estate Lead Score", description: "Estate lead confidence score", sourceModule: "lead", sourceField: "estateLeadScore", required: false, fallbackAllowed: true },
  { id: "v14", variableName: "deal_potential_score", label: "Deal Potential Score", description: "Deal potential score", sourceModule: "lead", sourceField: "dealPotentialScore", required: false, fallbackAllowed: true },
  { id: "v15", variableName: "data_confidence_score", label: "Data Confidence", description: "Data confidence score", sourceModule: "lead", sourceField: "dataConfidenceScore", required: false, fallbackAllowed: true },
  { id: "v16", variableName: "compliance_risk_level", label: "Compliance Risk", description: "Compliance risk level", sourceModule: "compliance", sourceField: "riskLevel", required: false, fallbackAllowed: true },
  { id: "v17", variableName: "offer_amount", label: "Offer Amount", description: "Proposed offer amount", sourceModule: "manual", sourceField: "offerAmount", required: false, fallbackAllowed: true },
  { id: "v18", variableName: "estimated_arv", label: "Estimated ARV", description: "After repair value estimate", sourceModule: "manual", sourceField: "estimatedArv", required: false, fallbackAllowed: true },
  { id: "v19", variableName: "estimated_repairs", label: "Estimated Repairs", description: "Repair cost estimate", sourceModule: "manual", sourceField: "estimatedRepairs", required: false, fallbackAllowed: true },
  { id: "v20", variableName: "assignment_fee_target", label: "Assignment Fee Target", description: "Target assignment spread", sourceModule: "manual", sourceField: "assignmentFeeTarget", required: false, fallbackAllowed: true },
  { id: "v21", variableName: "title_company", label: "Title Company", description: "Selected title company", sourceModule: "manual", sourceField: "titleCompany", required: false, fallbackAllowed: true },
  { id: "v22", variableName: "buyer_name", label: "Buyer Name", description: "Matched buyer name", sourceModule: "manual", sourceField: "buyerName", required: false, fallbackAllowed: true },
  { id: "v23", variableName: "date", label: "Date", description: "Current date", sourceModule: "system", sourceField: "date", required: false, fallbackAllowed: false },
  { id: "v24", variableName: "disclaimer", label: "Disclaimer", description: "Auto-inserted global disclaimer", sourceModule: "system", sourceField: "disclaimer", required: false, fallbackAllowed: false },
  { id: "v25", variableName: "attorney_review_reminder", label: "Attorney Review Reminder", description: "Auto-inserted review reminder", sourceModule: "system", sourceField: "attorneyReviewReminder", required: false, fallbackAllowed: false },
];

export const GENERATED_DOCUMENT_WARNING =
  "This document is generated from a workflow template. EstateLeadOS does not provide legal, tax, brokerage, financial, or investment advice. Review with a licensed attorney, broker, title company, or qualified professional before use.";

export const TEMPLATE_NOT_ATTORNEY_REVIEWED_WARNING =
  "This template has not been marked attorney-reviewed by SCS Nova. Professional review is recommended before use.";

export const ELEVATED_RISK_WARNING =
  "This state/deal workflow has elevated compliance risk. Review with a qualified professional before proceeding.";

export const MISSING_VARIABLE_WARNING =
  "This document is missing required information. Add the missing field or acknowledge that the document is incomplete before continuing.";
