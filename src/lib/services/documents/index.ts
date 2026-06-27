import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";

const p = () => getDataProvider();
import { DOCUMENT_TYPES } from "@/lib/constants/document-types";
import { DOCUMENT_VARIABLES } from "@/lib/constants/document-variables";
import { STARTER_TEMPLATES } from "@/lib/constants/starter-templates";
import { buildDocumentChecklist } from "@/lib/constants/compliance-templates";
import {
  calculateReadinessScore,
  generateDocument,
  getReadinessBand,
} from "@/lib/engines/document-generator";
import { checkDocumentBlockers } from "@/lib/engines/document-workflow-blockers";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getStateProfile } from "@/lib/services/compliance";
import { DEMO_DOCUMENT_BLOCKERS } from "@/lib/seed/demo-documents";
import type { DealType } from "@/lib/types/compliance";
import type { CrmPipelineStage } from "@/lib/types/crm";
import type {
  AttorneyReviewItem,
  DocumentAuditLogEntry,
  DocumentCenterOverview,
  DocumentCenterSection,
  DocumentGenerationResult,
  DocumentRecord,
  DocumentTemplate,
  DocumentWorkflowBlocker,
  LeadDocumentPacket,
  UploadedDocument,
} from "@/lib/types/documents";

export function getDocumentTypes() {
  return DOCUMENT_TYPES;
}

export function getStarterTemplates(): DocumentTemplate[] {
  return STARTER_TEMPLATES;
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id);
}

export function getDocumentVariables() {
  return DOCUMENT_VARIABLES;
}

export function getDocuments(filters?: {
  leadId?: string;
  state?: string;
  county?: string;
  dealType?: string;
  category?: string;
  status?: string;
  attorneyReview?: boolean;
  signatureNeeded?: boolean;
  section?: DocumentCenterSection;
}): DocumentRecord[] {
  let docs = shouldLoadSeedData() ? [...p().documents.getRecords()] : [];

  if (filters?.leadId) docs = docs.filter((d) => d.leadId === filters.leadId);
  if (filters?.state) docs = docs.filter((d) => d.stateAbbreviation === filters.state);
  if (filters?.county) docs = docs.filter((d) => d.countyName === filters.county);
  if (filters?.dealType) docs = docs.filter((d) => d.dealType === filters.dealType);
  if (filters?.category) docs = docs.filter((d) => d.documentCategory === filters.category);
  if (filters?.status) docs = docs.filter((d) => d.status === filters.status);
  if (filters?.attorneyReview) docs = docs.filter((d) => d.attorneyReviewFlag);
  if (filters?.signatureNeeded) docs = docs.filter((d) => d.signatureNeededFlag);

  if (filters?.section) {
    const sectionMap: Record<DocumentCenterSection, string[]> = {
      my_documents: [],
      state_deal_kit: ["state_deal_kit_documents"],
      lead_specific: ["lead_specific_documents"],
      seller: ["seller_documents"],
      buyer_assignee: ["buyer_assignee_documents"],
      title_company: ["title_company_documents"],
      internal_worksheets: ["internal_worksheets"],
      compliance: ["compliance_documents"],
      uploaded: ["uploaded_documents"],
      signed: ["signed_documents"],
      attorney_review_queue: [],
      template_library: [],
    };
    if (filters.section === "my_documents") {
      // all non-archived
    } else if (filters.section === "attorney_review_queue") {
      const queueIds = getAttorneyReviewQueue().map((a) => a.documentRecordId);
      docs = docs.filter((d) => queueIds.includes(d.id));
    } else if (filters.section === "uploaded") {
      docs = docs.filter((d) => d.status === "uploaded" || d.uploadedFileReference);
    } else if (filters.section === "signed") {
      docs = docs.filter((d) => d.status === "signed" || d.signatureStatus === "signed");
    } else if (filters.section === "lead_specific") {
      docs = docs.filter((d) => d.leadId !== null);
    } else if (filters.section !== "template_library") {
      const cats = sectionMap[filters.section];
      if (cats.length) docs = docs.filter((d) => cats.includes(d.documentCategory));
    }
  }

  return docs.filter((d) => !d.archived);
}

export function getDocumentById(id: string): DocumentRecord | null {
  return getDocuments().find((d) => d.id === id) ?? null;
}

export function getDocumentCenterOverview(): DocumentCenterOverview {
  const docs = getDocuments();
  const packets = getLeadPackets();
  const queue = getAttorneyReviewQueue();

  return {
    totalDocuments: docs.length,
    notStarted: docs.filter((d) => d.status === "not_started").length,
    generated: docs.filter((d) => ["generated", "draft"].includes(d.status)).length,
    uploaded: docs.filter((d) => d.status === "uploaded").length,
    sent: docs.filter((d) => d.status === "sent").length,
    signed: docs.filter((d) => d.status === "signed").length,
    reviewed: docs.filter((d) => d.status === "reviewed").length,
    needsAttorneyReview: docs.filter((d) => d.status === "needs_attorney_review" || d.attorneyReviewFlag).length,
    expired: docs.filter((d) => d.status === "expired").length,
    missingRequired: docs.filter((d) => d.requiredStatus === "required" && d.status === "not_started").length,
    packetsIncomplete: packets.filter((p) => ["incomplete", "needs_documents", "needs_attorney_review"].includes(p.packetStatus)).length,
    compliancePending: docs.filter((d) => d.documentCategory === "compliance_documents" && !["reviewed", "signed", "approved"].includes(d.status)).length,
    stateDealKitsActive: shouldLoadSeedData() ? 5 : 0,
  };
}

export function getLeadPackets(leadId?: string): LeadDocumentPacket[] {
  const packets = shouldLoadSeedData() ? p().documents.getPackets() : [];
  return leadId ? packets.filter((p) => p.leadId === leadId) : packets;
}

export function getLeadPacket(leadId: string): LeadDocumentPacket | null {
  return getLeadPackets(leadId)[0] ?? null;
}

export function getUploadedDocuments(leadId?: string): UploadedDocument[] {
  const uploads = shouldLoadSeedData() ? p().documents.getUploads() : [];
  return leadId ? uploads.filter((u) => u.leadId === leadId) : uploads;
}

export function getAttorneyReviewQueue(): AttorneyReviewItem[] {
  return shouldLoadSeedData() ? p().documents.getAttorneyQueue() : [];
}

export function getDocumentAuditLogs(documentRecordId?: string): DocumentAuditLogEntry[] {
  const logs = shouldLoadSeedData() ? p().documents.getAudit() : [];
  return documentRecordId ? logs.filter((l) => l.documentRecordId === documentRecordId) : logs;
}

export function getDocumentBlockers(leadId?: string): DocumentWorkflowBlocker[] {
  const blockers = shouldLoadSeedData() ? DEMO_DOCUMENT_BLOCKERS : [];
  return leadId ? blockers.filter((b) => b.leadId === leadId) : blockers;
}

export function runDocumentGeneration(params: {
  templateId: string;
  leadId: string | null;
  dealType: string;
  workflowStage: string;
}): DocumentGenerationResult | null {
  const template = getTemplateById(params.templateId);
  if (!template) return null;

  const lead = params.leadId ? getFullLeadByIdSync(params.leadId) : null;
  const state = lead ? getStateProfile(lead.state) : null;
  const riskElevated = state
    ? ["elevated", "high", "restricted", "attorney_review_required"].includes(state.riskRating)
    : false;

  return generateDocument({
    template,
    lead,
    leadId: params.leadId,
    dealType: params.dealType,
    workflowStage: params.workflowStage,
    complianceRiskElevated: riskElevated,
  });
}

export function buildDealKitDocuments(params: {
  stateAbbr: string;
  countyName: string | null;
  dealType: DealType;
  leadId?: string;
}): {
  checklist: ReturnType<typeof buildDocumentChecklist>;
  suggestedTemplates: DocumentTemplate[];
  missingTemplates: string[];
  readinessScore: number;
  readinessBand: string;
  complianceWarnings: string[];
} {
  const checklist = buildDocumentChecklist(params.dealType);
  const state = getStateProfile(params.stateAbbr);
  const suggestedTemplates = STARTER_TEMPLATES.filter((t) => t.active);

  const leadDocs = params.leadId ? getDocuments({ leadId: params.leadId }) : [];
  const required = checklist.filter((c) => c.requirementLevel === "required");
  const complete = required.filter((c) => {
    const type = DOCUMENT_TYPES.find((dt) => dt.name.toLowerCase() === c.documentName.toLowerCase());
    if (!type) return false;
    const doc = leadDocs.find((d) => d.documentTypeId === type.id);
    return doc && !["not_started", "expired", "rejected"].includes(doc.status);
  });

  const attorneyTotal = leadDocs.filter((d) => d.attorneyReviewFlag).length;
  const attorneyResolved = leadDocs.filter(
    (d) => d.attorneyReviewFlag && ["acknowledged", "reviewed", "not_required"].includes(d.attorneyReviewStatus)
  ).length;

  const score = calculateReadinessScore({
    totalRequired: required.length || 1,
    complete: complete.length,
    attorneyResolved,
    attorneyTotal: attorneyTotal || 1,
    variablesComplete: complete.length > required.length * 0.5,
    sourceAttached: leadDocs.some((d) => d.documentTypeId === "lead_source_record" && d.status !== "not_started"),
  });

  const missingTemplates = required
    .filter((c) => !suggestedTemplates.some((t) => t.templateName.toLowerCase().includes(c.documentName.split(" ")[0].toLowerCase())))
    .map((c) => c.documentName);

  const warnings: string[] = [];
  if (state) warnings.push(...state.userWarnings.slice(0, 2));
  warnings.push("Document Workflow Readiness does not mean legally compliant. Confirm with qualified professionals.");

  return {
    checklist,
    suggestedTemplates,
    missingTemplates,
    readinessScore: score,
    readinessBand: getReadinessBand(score),
    complianceWarnings: warnings,
  };
}

export function validateDocumentStageChange(
  leadId: string,
  toStage: CrmPipelineStage
): { allowed: boolean; blockers: DocumentWorkflowBlocker[]; message: string | null } {
  const docs = getDocuments({ leadId });
  const blockers = checkDocumentBlockers(toStage, docs, leadId);

  if (blockers.length > 0) {
    return {
      allowed: false,
      blockers,
      message: `${blockers.length} document workflow blocker(s) prevent pipeline movement to ${toStage.replace(/_/g, " ")}.`,
    };
  }

  return { allowed: true, blockers: [], message: null };
}

export function getDocumentsForLead(leadId: string): DocumentRecord[] {
  return getDocuments({ leadId });
}

export async function uploadLocalDocumentPlaceholder(
  file: File,
  params: { leadId: string; documentTypeId?: string }
): Promise<{ upload: UploadedDocument; warning: string }> {
  const { uploadDocumentPlaceholder } = await import("@/lib/supabase/supabaseStorage");
  const { getSessionContext } = await import("@/lib/config/session");
  const { getLocalState, persistLocalState } = await import("@/lib/local/localStateStore");
  const { appendPlatformAudit } = await import("@/lib/local/localAudit");

  const session = getSessionContext();
  const result = await uploadDocumentPlaceholder(file, {
    leadId: params.leadId,
    organizationId: session.organizationId,
  });

  const upload: UploadedDocument = {
    id: result.id,
    organizationId: session.organizationId,
    leadId: params.leadId,
    uploadedBy: session.userName,
    fileName: result.fileName,
    fileType: result.mimeType,
    fileSize: result.fileSize,
    documentCategory: "uploaded_documents",
    documentTypeId: params.documentTypeId ?? "uploaded-generic",
    stateAbbreviation: null,
    status: "uploaded",
    attorneyReviewFlag: false,
    signatureNeededFlag: false,
    notes: result.objectUrl ? `preview:${result.objectUrl}` : null,
    createdAt: new Date().toISOString(),
  };

  const state = getLocalState();
  state.uploadedDocuments = [upload, ...state.uploadedDocuments];
  persistLocalState();
  appendPlatformAudit({
    eventType: "document_uploaded",
    eventDescription: `Document upload placeholder: ${file.name}`,
    relatedModule: "documents",
    relatedRecordId: upload.id,
  });

  return { upload, warning: result.warning };
}
