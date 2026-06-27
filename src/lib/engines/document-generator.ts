import {
  DOCUMENT_VARIABLES,
  GENERATED_DOCUMENT_WARNING,
  TEMPLATE_NOT_ATTORNEY_REVIEWED_WARNING,
  ELEVATED_RISK_WARNING,
} from "@/lib/constants/document-variables";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import type {
  DocumentGenerationResult,
  DocumentRecord,
  DocumentTemplate,
  VariableValidationResult,
} from "@/lib/types/documents";
import type { FullLeadDetail } from "@/lib/types/crm";

const ATTORNEY_REMINDER =
  "Attorney/title company review is strongly recommended. EstateLeadOS cannot confirm legal compliance. Confirm with a qualified professional before proceeding.";

export function buildVariableContext(lead: FullLeadDetail | null, org?: { name?: string; phone?: string; email?: string }): Record<string, string> {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return {
    user_company_name: org?.name ?? "[Company Name]",
    user_name: "Alex Morgan",
    business_phone: org?.phone ?? "[Business Phone]",
    business_email: org?.email ?? "[Business Email]",
    property_address: lead?.propertyAddress ?? "[Property Address]",
    owner_name: lead?.ownerName ?? "[Owner Name]",
    possible_heir_name: lead?.possibleHeirName ?? "[Possible Heir]",
    mailing_address: lead?.mailingAddress ?? "[Mailing Address]",
    state: lead?.state ?? "[State]",
    county: lead?.county ?? "[County]",
    parcel_id: lead?.parcelId ?? "[Parcel ID]",
    lead_type: lead?.primaryLeadType?.replace(/_/g, " ") ?? "[Lead Type]",
    estate_lead_score: lead?.estateLeadScore?.toString() ?? "—",
    deal_potential_score: lead?.dealPotentialScore?.toString() ?? "—",
    data_confidence_score: lead?.dataConfidenceScore?.toString() ?? "—",
    compliance_risk_level: lead && lead.complianceRiskScore >= 60 ? "elevated" : "moderate",
    offer_amount: "[Offer Amount — enter manually]",
    estimated_arv: lead?.estimatedValue?.toLocaleString() ?? "[Estimated ARV]",
    estimated_repairs: "[Estimated Repairs — enter manually]",
    assignment_fee_target: "[Assignment Fee Target]",
    title_company: "[Title Company]",
    buyer_name: "[Buyer Name — Phase 6]",
    date: today,
    disclaimer: GLOBAL_DISCLAIMER,
    attorney_review_reminder: ATTORNEY_REMINDER,
  };
}

export function validateVariables(
  template: DocumentTemplate,
  context: Record<string, string>
): VariableValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const resolved: Record<string, string> = {};

  const varDefs = DOCUMENT_VARIABLES.filter((v) => template.variables.includes(v.variableName));

  for (const v of varDefs) {
    const val = context[v.variableName];
    const isMissing = !val || val.startsWith("[") && val.endsWith("]");
    if (isMissing) {
      if (v.required) missingRequired.push(v.variableName);
      else missingOptional.push(v.variableName);
    } else {
      resolved[v.variableName] = val;
    }
  }

  let status: VariableValidationResult["status"] = "complete";
  if (missingRequired.length > 0) status = "missing_required";
  else if (missingOptional.length > 0) status = "missing_optional";

  return { status, missingRequired, missingOptional, resolved };
}

export function replaceVariables(body: string, context: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function generateDocument(params: {
  template: DocumentTemplate;
  lead: FullLeadDetail | null;
  leadId: string | null;
  dealType: string;
  workflowStage: string;
  complianceRiskElevated?: boolean;
  createdBy?: string;
}): DocumentGenerationResult {
  const { template, lead, leadId, dealType, workflowStage, complianceRiskElevated, createdBy = "demo-user" } = params;
  const context = buildVariableContext(lead);
  const validation = validateVariables(template, context);
  const content = replaceVariables(template.body, context);
  const warnings: string[] = [GENERATED_DOCUMENT_WARNING];

  if (!template.attorneyReviewed) warnings.push(TEMPLATE_NOT_ATTORNEY_REVIEWED_WARNING);
  if (complianceRiskElevated) warnings.push(ELEVATED_RISK_WARNING);
  if (validation.status === "missing_required") {
    warnings.push(`Missing required variables: ${validation.missingRequired.join(", ")}`);
  }

  const fullContent = `${content}\n\n---\n${warnings.join("\n\n")}`;

  const now = new Date().toISOString();
  const record: DocumentRecord = {
    id: `doc-gen-${Date.now()}`,
    organizationId: "demo-org",
    leadId,
    stateAbbreviation: lead?.state ?? null,
    countyName: lead?.county ?? null,
    dealType,
    workflowStage,
    documentName: template.templateName,
    documentTypeId: template.documentTypeId,
    documentCategory: template.category,
    version: 1,
    createdBy,
    updatedBy: createdBy,
    status: validation.status === "missing_required" ? "draft" : "generated",
    requiredStatus: "required",
    requiredReason: `Required for ${dealType} workflow`,
    attorneyReviewFlag: template.attorneyReviewed === false,
    attorneyReviewStatus: template.attorneyReviewed ? "not_required" : "recommended",
    signatureNeededFlag: template.documentTypeId.includes("ack") || template.documentTypeId === "seller_intake_form",
    signatureStatus: "not_required",
    sourceFieldsUsed: Object.keys(validation.resolved),
    templateId: template.id,
    templateVersion: template.version,
    fileUrl: null,
    uploadedFileReference: null,
    generatedContentSnapshot: fullContent,
    disclaimer: template.disclaimer,
    notes: null,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    success: true,
    documentRecord: record,
    content: fullContent,
    warnings,
    missingVariables: [...validation.missingRequired, ...validation.missingOptional],
    variableStatus: validation.status,
  };
}

export function calculateReadinessScore(params: {
  totalRequired: number;
  complete: number;
  attorneyResolved: number;
  attorneyTotal: number;
  variablesComplete: boolean;
  sourceAttached: boolean;
}): number {
  const { totalRequired, complete, attorneyResolved, attorneyTotal, variablesComplete, sourceAttached } = params;
  if (totalRequired === 0) return 0;

  let score = (complete / totalRequired) * 60;
  if (attorneyTotal > 0) score += (attorneyResolved / attorneyTotal) * 15;
  if (variablesComplete) score += 10;
  if (sourceAttached) score += 15;

  return Math.min(100, Math.round(score));
}

export function getReadinessBand(score: number): string {
  if (score >= 90) return "Ready for Review";
  if (score >= 75) return "Mostly Ready";
  if (score >= 50) return "Partially Ready";
  if (score >= 25) return "Needs Work";
  return "Not Ready";
}
