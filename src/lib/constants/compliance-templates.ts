import type {
  DealType,
  DocumentCategory,
  EquipmentChecklistItem,
  DocumentChecklistItem,
  GettingStartedItem,
  WorkflowStage,
} from "@/lib/types/compliance";

const now = () => new Date().toISOString();

export const EQUIPMENT_TEMPLATE: Omit<
  EquipmentChecklistItem,
  "id" | "status" | "lastUpdatedAt" | "dealTypeSpecific"
>[] = [
  { itemName: "Business phone number", description: "Dedicated business line for outreach", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Business email", description: "Professional email for seller and title communication", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "LLC or business entity info", description: "Entity documentation for contracts", requirementLevel: "required", stateSpecific: true, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "CRM setup", description: "Lead and communication tracking configured", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Document storage", description: "Secure storage for deal documents", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "E-signature tool", description: "For sending agreements and disclosures", requirementLevel: "recommended", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Proof of funds source", description: "Documentation for purchase capability", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: true, acknowledgementRequired: false },
  { itemName: "Title company contact", description: "Licensed title company for closing", requirementLevel: "required", stateSpecific: true, notes: null, blockingStatus: true, acknowledgementRequired: false },
  { itemName: "Real estate attorney contact", description: "Attorney for state-specific review where needed", requirementLevel: "recommended", stateSpecific: true, notes: null, blockingStatus: false, acknowledgementRequired: true },
  { itemName: "Broker contact", description: "Licensed broker referral contact if needed", requirementLevel: "recommended", stateSpecific: true, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Skip tracing provider", description: "For heir/owner research when permitted", requirementLevel: "recommended", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Do Not Call screening process", description: "DNC list screening before outreach", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: true, acknowledgementRequired: true },
  { itemName: "Property inspection checklist", description: "Standard property condition assessment", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Repair estimate worksheet", description: "Repair cost estimation tool", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Comparable-sales tool", description: "ARV and comp research capability", requirementLevel: "required", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Buyer list", description: "Active buyer network for disposition", requirementLevel: "recommended", stateSpecific: false, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Assignment agreement template", description: "Assignment contract template for review", requirementLevel: "recommended", stateSpecific: true, notes: null, blockingStatus: false, acknowledgementRequired: false },
  { itemName: "Disclosure packet", description: "State-appropriate disclosure materials", requirementLevel: "required", stateSpecific: true, notes: null, blockingStatus: true, acknowledgementRequired: false },
  { itemName: "Call recording rules reminder", description: "Recording consent requirements acknowledged", requirementLevel: "recommended", stateSpecific: true, notes: null, blockingStatus: false, acknowledgementRequired: true },
  { itemName: "State-specific outreach caution", description: "State outreach rules reviewed", requirementLevel: "required", stateSpecific: true, notes: null, blockingStatus: true, acknowledgementRequired: true },
];

export const DOCUMENT_TEMPLATE: {
  documentName: string;
  documentCategory: DocumentCategory;
  requirementLevel: "required" | "recommended" | "not_required";
  requiredByState: boolean;
  requiredByDealType: DealType[];
  requiredByWorkflowStage: WorkflowStage[];
  attorneyReviewFlag: boolean;
  signatureNeededFlag: boolean;
  uploadAllowed: boolean;
  generateAllowed: boolean;
  blockingStatus: boolean;
}[] = [
  { documentName: "Seller intake form", documentCategory: "seller_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract", "double_closing"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: true, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Owner/heir verification checklist", documentCategory: "compliance_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Property research sheet", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Probate status checklist", documentCategory: "compliance_documents", requirementLevel: "recommended", requiredByState: true, requiredByDealType: ["direct_purchase"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: true, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Lead source record", documentCategory: "source_records", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Purchase offer worksheet", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Repair estimate worksheet", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Comparable sales worksheet", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Max allowable offer worksheet", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Purchase agreement checklist", documentCategory: "seller_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: true, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Assignment disclosure checklist", documentCategory: "compliance_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["assignment_of_contract"], requiredByWorkflowStage: ["assignment_sent"], attorneyReviewFlag: true, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Seller disclosure acknowledgement", documentCategory: "seller_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: true, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Buyer/assignee disclosure acknowledgement", documentCategory: "buyer_assignee_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["assignment_of_contract", "buyer_network_disposition"], requiredByWorkflowStage: ["assignment_sent", "buyer_matched"], attorneyReviewFlag: true, signatureNeededFlag: true, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Assignment agreement checklist", documentCategory: "buyer_assignee_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["assignment_of_contract"], requiredByWorkflowStage: ["assignment_sent"], attorneyReviewFlag: true, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Title company intake form", documentCategory: "title_company_documents", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract", "double_closing"], requiredByWorkflowStage: ["closing_scheduled"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Proof of funds record", documentCategory: "buyer_assignee_documents", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Buyer profile sheet", documentCategory: "buyer_assignee_documents", requirementLevel: "required", requiredByState: false, requiredByDealType: ["assignment_of_contract", "buyer_network_disposition"], requiredByWorkflowStage: ["buyer_matched", "assignment_sent"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Deal memo", documentCategory: "internal_worksheets", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "Closing checklist", documentCategory: "title_company_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract", "double_closing"], requiredByWorkflowStage: ["closing_scheduled"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Communication log export", documentCategory: "audit_documents", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["closing_scheduled"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: true, blockingStatus: true },
  { documentName: "Compliance acknowledgement", documentCategory: "compliance_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract", "double_closing"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: true, uploadAllowed: false, generateAllowed: true, blockingStatus: true },
  { documentName: "Attorney review confirmation", documentCategory: "compliance_documents", requirementLevel: "recommended", requiredByState: true, requiredByDealType: ["assignment_of_contract", "needs_attorney_review"], requiredByWorkflowStage: ["under_contract", "assignment_sent"], attorneyReviewFlag: true, signatureNeededFlag: true, uploadAllowed: true, generateAllowed: true, blockingStatus: false },
  { documentName: "State risk acknowledgement", documentCategory: "compliance_documents", requirementLevel: "required", requiredByState: true, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract"], attorneyReviewFlag: false, signatureNeededFlag: true, uploadAllowed: false, generateAllowed: true, blockingStatus: true },
  { documentName: "Source document packet", documentCategory: "source_records", requirementLevel: "required", requiredByState: false, requiredByDealType: ["direct_purchase", "assignment_of_contract"], requiredByWorkflowStage: ["under_contract", "closing_scheduled"], attorneyReviewFlag: false, signatureNeededFlag: false, uploadAllowed: true, generateAllowed: false, blockingStatus: true },
];

export const GETTING_STARTED_TEMPLATE: string[] = [
  "Select state",
  "Select county",
  "Confirm state support status",
  "Confirm county support status",
  "Review state risk rating",
  "Review county data availability",
  "Confirm user role",
  "Select deal type",
  "Select acquisition strategy",
  "Review legal source links",
  "Review outreach caution",
  "Review disclosure reminders",
  "Review assignment risk notes",
  "Review attorney/title company reminder",
  "Confirm source documents will be attached",
  "Confirm communication log will be maintained",
  "Acknowledge no legal advice disclaimer",
];

export const ACKNOWLEDGEMENT_TEXTS: Record<string, string> = {
  general_compliance: "I understand EstateLeadOS does not provide legal, tax, brokerage, financial, or investment advice. I am responsible for confirming requirements with a qualified professional.",
  attorney_review: "I understand this workflow may require review by a licensed attorney, broker, title company, or qualified professional before I proceed.",
  assignment_risk: "I understand that assignment activity and marketing contract interests may involve state-specific rules, disclosure requirements, and licensing risk.",
  outreach_risk: "I understand I am responsible for following applicable call, text, email, mail, consent, and Do Not Contact requirements.",
  source_risk: "I understand this source is marked research-only, manual-only, unknown, or not fully reviewed by SCS Nova.",
  state_risk: "I understand this state/county workflow may involve elevated compliance risk. EstateLeadOS cannot confirm legal compliance.",
  brokerage_interest: "I confirm I am marketing my contract interest, not acting as a broker or selling property I do not own.",
  recording_consent: "I understand call recording may require consent in this state and I am responsible for compliance.",
};

export function buildEquipmentChecklist(
  dealType: DealType,
  stateRiskElevated: boolean
): EquipmentChecklistItem[] {
  const assignmentDeals: DealType[] = ["assignment_of_contract", "buyer_network_disposition"];
  return EQUIPMENT_TEMPLATE.map((item, i) => {
    let requirementLevel = item.requirementLevel;
    let blockingStatus = item.blockingStatus;
    const dealTypeSpecific: DealType[] = [];

    if (item.itemName === "Buyer list" && assignmentDeals.includes(dealType)) {
      requirementLevel = "required";
      dealTypeSpecific.push(dealType);
    }
    if (item.itemName === "Assignment agreement template" && dealType === "assignment_of_contract") {
      requirementLevel = "required";
      dealTypeSpecific.push(dealType);
    }
    if (item.itemName === "Real estate attorney contact" && stateRiskElevated) {
      requirementLevel = "required";
      blockingStatus = true;
    }
    if (item.itemName === "Do Not Call screening process") {
      dealTypeSpecific.push("direct_purchase", "assignment_of_contract");
    }

    return {
      id: `eq-${i}`,
      ...item,
      dealTypeSpecific,
      requirementLevel,
      blockingStatus,
      status: "not_started" as const,
      lastUpdatedAt: now(),
    };
  });
}

export function buildDocumentChecklist(dealType: DealType): DocumentChecklistItem[] {
  return DOCUMENT_TEMPLATE.filter(
    (d) =>
      d.requiredByDealType.length === 0 ||
      d.requiredByDealType.includes(dealType)
  ).map((d, i) => ({
    id: `doc-${i}`,
    ...d,
    requiredByDealType: d.requiredByDealType,
    currentStatus: "not_started" as const,
    notes: null,
    lastUpdatedAt: now(),
  }));
}

export function buildGettingStartedChecklist(): GettingStartedItem[] {
  return GETTING_STARTED_TEMPLATE.map((label, i) => ({
    id: `gs-${i}`,
    label,
    status: "not_started" as const,
    blocking: [
      "Confirm state support status",
      "Confirm county support status",
      "Acknowledge no legal advice disclaimer",
    ].includes(label),
  }));
}
