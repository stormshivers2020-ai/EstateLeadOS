export const DOCUMENT_STATUSES = [
  "not_started", "generated", "draft", "sent", "uploaded", "signed",
  "reviewed", "needs_attorney_review", "approved", "rejected", "expired", "not_required",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ATTORNEY_REVIEW_STATUSES = [
  "not_required", "recommended", "required", "requested", "in_review",
  "reviewed", "acknowledged", "not_available",
] as const;

export type AttorneyReviewStatus = (typeof ATTORNEY_REVIEW_STATUSES)[number];

export const SIGNATURE_STATUSES = [
  "not_required", "needed", "sent", "signed", "declined", "expired", "unknown",
] as const;

export type SignatureStatus = (typeof SIGNATURE_STATUSES)[number];

export const REQUIRED_LOGIC_STATUSES = [
  "required", "recommended", "not_required", "unknown", "conditional", "required_before_stage",
] as const;

export type RequiredLogicStatus = (typeof REQUIRED_LOGIC_STATUSES)[number];

export const DOCUMENT_CENTER_SECTIONS = [
  "my_documents", "state_deal_kit", "lead_specific", "seller", "buyer_assignee",
  "title_company", "internal_worksheets", "compliance", "uploaded", "signed",
  "attorney_review_queue", "template_library",
] as const;

export type DocumentCenterSection = (typeof DOCUMENT_CENTER_SECTIONS)[number];

export const DOC_CATEGORIES = [
  "seller_documents", "buyer_assignee_documents", "title_company_documents",
  "internal_worksheets", "compliance_documents", "source_records", "audit_documents",
  "state_deal_kit_documents", "lead_specific_documents", "uploaded_documents", "signed_documents",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const TEMPLATE_REVIEW_STATUSES = [
  "draft", "internal_review", "approved", "needs_attorney_review",
  "attorney_reviewed", "deprecated", "archived",
] as const;

export type TemplateReviewStatus = (typeof TEMPLATE_REVIEW_STATUSES)[number];

export const PACKET_STATUSES = [
  "not_started", "building", "incomplete", "needs_documents", "needs_attorney_review",
  "ready_for_review", "reviewed", "archived",
] as const;

export type PacketStatus = (typeof PACKET_STATUSES)[number];

export const READINESS_BANDS = [
  { min: 0, max: 24, label: "Not Ready", id: "not_ready" },
  { min: 25, max: 49, label: "Needs Work", id: "needs_work" },
  { min: 50, max: 74, label: "Partially Ready", id: "partially_ready" },
  { min: 75, max: 89, label: "Mostly Ready", id: "mostly_ready" },
  { min: 90, max: 100, label: "Ready for Review", id: "ready_for_review" },
] as const;

export interface DocumentTypeDefinition {
  id: string;
  name: string;
  category: DocCategory;
  description: string;
  requirementLogic: RequiredLogicStatus;
  stateSpecific: boolean;
  countySpecific: boolean;
  dealTypeSpecific: boolean;
  workflowStageSpecific: boolean;
  attorneyReviewFlag: boolean;
  signatureNeededFlag: boolean;
  uploadAllowed: boolean;
  generateAllowed: boolean;
  versionRequired: boolean;
  disclaimerRequired: boolean;
  auditRequired: boolean;
}

export interface DocumentVariable {
  id: string;
  variableName: string;
  label: string;
  description: string;
  sourceModule: string;
  sourceField: string;
  required: boolean;
  fallbackAllowed: boolean;
}

export interface DocumentTemplate {
  id: string;
  organizationId: string | null;
  templateName: string;
  documentTypeId: string;
  category: DocCategory;
  stateId: string | null;
  countyId: string | null;
  dealType: string | null;
  requiredPlan: string | null;
  variables: string[];
  body: string;
  disclaimer: string;
  reviewStatus: TemplateReviewStatus;
  lastReviewedAt: string | null;
  version: number;
  active: boolean;
  attorneyReviewed: boolean;
  attorneyReviewNotes: string | null;
  internalNotes: string | null;
  purpose: string;
  checklistItems?: string[];
}

export interface DocumentRecord {
  id: string;
  organizationId: string;
  leadId: string | null;
  stateAbbreviation: string | null;
  countyName: string | null;
  dealType: string | null;
  workflowStage: string | null;
  documentName: string;
  documentTypeId: string;
  documentCategory: DocCategory;
  version: number;
  createdBy: string;
  updatedBy: string;
  status: DocumentStatus;
  requiredStatus: RequiredLogicStatus;
  requiredReason: string | null;
  attorneyReviewFlag: boolean;
  attorneyReviewStatus: AttorneyReviewStatus;
  signatureNeededFlag: boolean;
  signatureStatus: SignatureStatus;
  sourceFieldsUsed: string[];
  templateId: string | null;
  templateVersion: number | null;
  fileUrl: string | null;
  uploadedFileReference: string | null;
  generatedContentSnapshot: string | null;
  disclaimer: string;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDocumentPacket {
  id: string;
  organizationId: string;
  leadId: string;
  stateAbbreviation: string;
  countyName: string;
  dealType: string;
  packetStatus: PacketStatus;
  readinessScore: number;
  readinessBand: string;
  missingDocuments: string[];
  attorneyReviewItems: string[];
  signedDocumentItems: string[];
  uploadedDocumentItems: string[];
  generatedDocumentItems: string[];
  sourceRecordItems: string[];
  documentRecordIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDocument {
  id: string;
  organizationId: string;
  leadId: string | null;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentCategory: DocCategory;
  documentTypeId: string;
  stateAbbreviation: string | null;
  status: DocumentStatus;
  attorneyReviewFlag: boolean;
  signatureNeededFlag: boolean;
  notes: string | null;
  createdAt: string;
}

export interface AttorneyReviewItem {
  id: string;
  organizationId: string;
  leadId: string;
  documentRecordId: string;
  stateAbbreviation: string;
  countyName: string;
  dealType: string;
  documentName: string;
  riskLevel: string;
  reviewReason: string;
  templateReviewStatus: string;
  documentStatus: DocumentStatus;
  assignedReviewer: string | null;
  reviewStatus: AttorneyReviewStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  leadId: string | null;
  documentRecordId: string;
  actionType: string;
  actionDescription: string;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface DocumentWorkflowBlocker {
  id: string;
  organizationId: string;
  leadId: string;
  documentRecordId: string | null;
  workflowStage: string;
  blockerType: string;
  blockerMessage: string;
  requiredAction: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface DocumentGenerationResult {
  success: boolean;
  documentRecord: DocumentRecord | null;
  content: string;
  warnings: string[];
  missingVariables: string[];
  variableStatus: VariableValidationResult["status"];
}

export interface DocumentCenterOverview {
  totalDocuments: number;
  notStarted: number;
  generated: number;
  uploaded: number;
  sent: number;
  signed: number;
  reviewed: number;
  needsAttorneyReview: number;
  expired: number;
  missingRequired: number;
  packetsIncomplete: number;
  compliancePending: number;
  stateDealKitsActive: number;
}

export interface VariableValidationResult {
  status: "complete" | "missing_optional" | "missing_required" | "needs_manual_entry" | "unknown_source" | "manual_review_required";
  missingRequired: string[];
  missingOptional: string[];
  resolved: Record<string, string>;
}
