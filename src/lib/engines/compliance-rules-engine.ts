import type {
  AcquisitionStrategy,
  ComplianceCheckResult,
  ComplianceRuleAnswers,
  CountyProfile,
  DealType,
  DocumentChecklistItem,
  EquipmentChecklistItem,
  RiskRating,
  StateProfile,
  WorkflowBlocker,
  WorkflowStage,
} from "@/lib/types/compliance";
import { ACKNOWLEDGEMENT_TEXTS } from "@/lib/constants/compliance-templates";
import type { AcknowledgementType } from "@/lib/types/compliance";

const ELEVATED_RISKS: RiskRating[] = ["elevated", "high", "restricted", "attorney_review_required"];

function maxRisk(a: RiskRating, b: RiskRating): RiskRating {
  const order: RiskRating[] = ["low", "moderate", "elevated", "high", "restricted", "attorney_review_required"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export interface ComplianceEngineInput {
  state: StateProfile;
  county: CountyProfile | null;
  dealType: DealType;
  acquisitionStrategy: AcquisitionStrategy;
  targetStage?: WorkflowStage;
  equipmentChecklist: EquipmentChecklistItem[];
  documentChecklist: DocumentChecklistItem[];
  ownerIdentityVerified: boolean;
  sourceDocumentsAttached: boolean;
  communicationLogActive: boolean;
  acknowledgementsComplete: boolean;
  unknownSourceTerms: boolean;
  leadId?: string;
  organizationId: string;
  checkedBy: string;
}

export function runComplianceCheck(input: ComplianceEngineInput): ComplianceCheckResult {
  const {
    state,
    county,
    dealType,
    acquisitionStrategy,
    equipmentChecklist,
    documentChecklist,
    ownerIdentityVerified,
    sourceDocumentsAttached,
    acknowledgementsComplete,
    unknownSourceTerms,
    leadId,
    organizationId,
    checkedBy,
  } = input;

  let riskLevel: RiskRating = state.riskRating;
  if (county) riskLevel = maxRisk(riskLevel, county.countyRiskRating);

  const requiredActions: string[] = [];
  const requiredAcknowledgements: AcknowledgementType[] = [];
  const activeBlockers: WorkflowBlocker[] = [];
  const blockedStages: WorkflowStage[] = [];
  const allowedStages: WorkflowStage[] = ["new_lead", "needs_research"];

  const answers: ComplianceRuleAnswers = {
    wholesalingDisclosureRequired: state.wholesalingDisclosureNotes ? "unknown" : "unknown",
    sellerDisclosureRequired: state.sellerDisclosureChecklist.length > 0 ? true : "unknown",
    buyerAssigneeDisclosureRequired: dealType === "assignment_of_contract" ? true : "unknown",
    assignmentLicenseRisk: dealType === "assignment_of_contract" ? "unknown" : false,
    marketPropertyOrContractInterest: dealType === "assignment_of_contract"
      ? "contract_interest_only"
      : "review_required",
    attorneyReviewRecommended:
      ELEVATED_RISKS.includes(state.riskRating) ||
      dealType === "needs_attorney_review" ||
      dealType === "assignment_of_contract",
    callTextRestrictions: state.callTextRestrictions ? true : "unknown",
    recordingConsentConcerns: state.recordingConsentReminder ? true : "unknown",
    countyProbateAccessLimits: county?.probateCourtAccessStatus === "limited" ? true : "unknown",
    stateSupportLevel: state.supportedStatus,
    countySupportLevel: county?.supportedStatus ?? null,
    sourceDocumentsAttached,
    documentChecklistComplete: isDocumentChecklistComplete(documentChecklist, dealType),
    equipmentChecklistComplete: isEquipmentChecklistComplete(equipmentChecklist),
    acknowledgementsComplete,
    ownerIdentityVerified,
    unknownSourceTerms,
    canProgressToStage: false,
  };

  // State support warnings
  if (["research_only", "restricted", "attorney_review_required", "unavailable"].includes(state.supportedStatus)) {
    requiredActions.push(`State ${state.stateAbbreviation} is marked ${state.supportedStatus.replace(/_/g, " ")}. Review required before continuing.`);
    requiredAcknowledgements.push("state_risk");
    if (state.supportedStatus === "restricted") {
      blockedStages.push("under_contract", "assignment_sent", "closing_scheduled");
      riskLevel = maxRisk(riskLevel, "restricted");
    }
    if (state.supportedStatus === "attorney_review_required") {
      requiredAcknowledgements.push("attorney_review");
      riskLevel = maxRisk(riskLevel, "attorney_review_required");
    }
  }

  // County support warnings
  if (county) {
    if (["blocked", "unknown", "unavailable", "research_only"].includes(county.supportedStatus)) {
      requiredActions.push(`County ${county.countyName} is ${county.supportedStatus.replace(/_/g, " ")}. Automated data pulling is disabled.`);
      requiredAcknowledgements.push("source_risk");
    }
    if (county.supportedStatus === "manual_upload_only") {
      requiredActions.push("Use CSV import or manual research for this county.");
    }
  }

  if (unknownSourceTerms) {
    requiredActions.push("Source terms are not reviewed. Confirm data source permissions.");
    requiredAcknowledgements.push("source_risk");
    riskLevel = maxRisk(riskLevel, "elevated");
  }

  if (dealType === "assignment_of_contract") {
    requiredAcknowledgements.push("assignment_risk", "brokerage_interest");
    requiredActions.push("Confirm you are marketing contract interest, not acting as a broker.");
    answers.assignmentLicenseRisk = "unknown";
  }

  if (acquisitionStrategy === "seller_outreach_preparation" || acquisitionStrategy === "direct_acquisition") {
    requiredAcknowledgements.push("outreach_risk");
    if (state.recordingConsentReminder) requiredAcknowledgements.push("recording_consent");
  }

  if (ELEVATED_RISKS.includes(riskLevel)) {
    requiredAcknowledgements.push("general_compliance", "attorney_review");
  }

  requiredAcknowledgements.push("general_compliance");

  // Workflow blockers for Under Contract
  const underContractBlockers = evaluateUnderContractBlockers(input, riskLevel);
  activeBlockers.push(...underContractBlockers);

  const assignmentBlockers = evaluateAssignmentBlockers(input, riskLevel);
  activeBlockers.push(...assignmentBlockers);

  const closingBlockers = evaluateClosingBlockers(input, riskLevel);
  activeBlockers.push(...closingBlockers);

  if (underContractBlockers.some((b) => b.severity === "blocking" || b.severity === "restricted")) {
    blockedStages.push("under_contract");
  } else if (acknowledgementsComplete && ownerIdentityVerified) {
    allowedStages.push("under_contract");
  }

  if (assignmentBlockers.some((b) => b.severity === "blocking" || b.severity === "restricted")) {
    blockedStages.push("buyer_matched", "assignment_sent");
  } else if (allowedStages.includes("under_contract")) {
    allowedStages.push("buyer_matched");
  }

  if (closingBlockers.some((b) => b.severity === "blocking")) {
    blockedStages.push("closing_scheduled");
  }

  if (riskLevel === "restricted" && !acknowledgementsComplete) {
    blockedStages.push("under_contract", "buyer_matched", "assignment_sent", "closing_scheduled");
  }

  answers.canProgressToStage = input.targetStage
    ? !blockedStages.includes(input.targetStage)
    : blockedStages.length === 0;

  const explanation = buildExplanation(riskLevel, requiredActions, activeBlockers);

  return {
    id: `check-${Date.now()}`,
    leadId: leadId ?? null,
    organizationId,
    stateProfileId: state.id,
    countyProfileId: county?.id ?? null,
    dealType,
    acquisitionStrategy,
    riskLevel,
    requiredActions: [...new Set(requiredActions)],
    requiredAcknowledgements: [...new Set(requiredAcknowledgements)],
    activeBlockers,
    allowedStages: [...new Set(allowedStages)],
    blockedStages: [...new Set(blockedStages)],
    explanation,
    answers,
    checkedAt: new Date().toISOString(),
    checkedBy,
  };
}

function isDocumentChecklistComplete(items: DocumentChecklistItem[], dealType: DealType): boolean {
  const required = items.filter(
    (d) => d.requirementLevel === "required" && d.requiredByDealType.includes(dealType)
  );
  return required.every((d) => ["uploaded", "signed", "reviewed", "generated"].includes(d.currentStatus));
}

function isEquipmentChecklistComplete(items: EquipmentChecklistItem[]): boolean {
  const required = items.filter((e) => e.requirementLevel === "required");
  return required.every((e) => e.status === "complete");
}

function evaluateUnderContractBlockers(
  input: ComplianceEngineInput,
  riskLevel: RiskRating
): WorkflowBlocker[] {
  const blockers: WorkflowBlocker[] = [];
  const base = {
    leadId: input.leadId ?? "pending",
    stateProfileId: input.state.id,
    countyProfileId: input.county?.id ?? null,
    workflowStage: "under_contract" as WorkflowStage,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  };

  if (!input.county) {
    blockers.push({
      ...base,
      id: "blk-county",
      blockerType: "missing_county",
      blockerMessage: "County must be selected before moving to Under Contract.",
      requiredAction: "Select a county in State Deal Kit.",
      severity: "blocking",
    });
  }

  if (!input.ownerIdentityVerified) {
    blockers.push({
      ...base,
      id: "blk-owner",
      blockerType: "owner_verification",
      blockerMessage: "Owner identity has not been verified.",
      requiredAction: "Complete owner/heir verification checklist.",
      severity: "blocking",
    });
  }

  if (!input.sourceDocumentsAttached) {
    blockers.push({
      ...base,
      id: "blk-source-docs",
      blockerType: "source_documents",
      blockerMessage: "Source documents are not attached.",
      requiredAction: "Attach source document packet.",
      severity: "blocking",
    });
  }

  if (!input.communicationLogActive) {
    blockers.push({
      ...base,
      id: "blk-comm-log",
      blockerType: "communication_log",
      blockerMessage: "Communication log is not active.",
      requiredAction: "Activate communication log before outreach.",
      severity: "warning",
    });
  }

  if (!input.acknowledgementsComplete) {
    blockers.push({
      ...base,
      id: "blk-ack",
      blockerType: "acknowledgements",
      blockerMessage: "Required compliance acknowledgements are incomplete.",
      requiredAction: "Complete all required acknowledgements.",
      severity: ELEVATED_RISKS.includes(riskLevel) ? "blocking" : "elevated",
    });
  }

  const incompleteDocs = input.documentChecklist.filter(
    (d) =>
      d.blockingStatus &&
      d.requirementLevel === "required" &&
      d.requiredByWorkflowStage.includes("under_contract") &&
      !["uploaded", "signed", "reviewed", "generated"].includes(d.currentStatus)
  );
  for (const doc of incompleteDocs) {
    blockers.push({
      ...base,
      id: `blk-doc-${doc.id}`,
      blockerType: "missing_document",
      blockerMessage: `${doc.documentName} is not complete.`,
      requiredAction: `Complete or upload ${doc.documentName}.`,
      severity: doc.attorneyReviewFlag ? "elevated" : "blocking",
    });
  }

  if (riskLevel === "restricted") {
    blockers.push({
      ...base,
      id: "blk-restricted",
      blockerType: "restricted_risk",
      blockerMessage: "Compliance risk is Restricted. Workflow movement is blocked until cleared.",
      requiredAction: "Contact Compliance Reviewer or complete attorney review acknowledgement.",
      severity: "restricted",
    });
  }

  return blockers;
}

function evaluateAssignmentBlockers(
  input: ComplianceEngineInput,
  riskLevel: RiskRating
): WorkflowBlocker[] {
  if (input.dealType !== "assignment_of_contract" && input.dealType !== "buyer_network_disposition") {
    return [];
  }

  const blockers: WorkflowBlocker[] = [];
  const base = {
    leadId: input.leadId ?? "pending",
    stateProfileId: input.state.id,
    countyProfileId: input.county?.id ?? null,
    workflowStage: "assignment_sent" as WorkflowStage,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  };

  blockers.push({
    ...base,
    id: "blk-brokerage",
    blockerType: "brokerage_interest",
    blockerMessage: "User must confirm marketing contract interest, not acting as broker.",
    requiredAction: "Complete brokerage interest acknowledgement.",
    severity: "blocking",
  });

  const assignmentDocs = input.documentChecklist.filter(
    (d) =>
      d.blockingStatus &&
      d.requiredByWorkflowStage.includes("assignment_sent") &&
      !["uploaded", "signed", "reviewed", "generated"].includes(d.currentStatus)
  );
  for (const doc of assignmentDocs) {
    blockers.push({
      ...base,
      id: `blk-assign-doc-${doc.id}`,
      blockerType: "assignment_document",
      blockerMessage: `${doc.documentName} required for assignment.`,
      requiredAction: `Complete ${doc.documentName}.`,
      severity: "blocking",
    });
  }

  const titleContact = input.equipmentChecklist.find((e) => e.itemName === "Title company contact");
  if (titleContact && titleContact.status !== "complete") {
    blockers.push({
      ...base,
      id: "blk-title",
      blockerType: "title_company",
      blockerMessage: "Title company has not been selected.",
      requiredAction: "Add title company contact to equipment checklist.",
      severity: "blocking",
    });
  }

  if (ELEVATED_RISKS.includes(riskLevel)) {
    blockers.push({
      ...base,
      id: "blk-attorney-assign",
      blockerType: "attorney_review",
      blockerMessage: "Attorney/title company review is strongly recommended for assignment workflow.",
      requiredAction: "Acknowledge attorney review reminder.",
      severity: "elevated",
    });
  }

  return blockers;
}

function evaluateClosingBlockers(
  input: ComplianceEngineInput,
  riskLevel: RiskRating
): WorkflowBlocker[] {
  const blockers: WorkflowBlocker[] = [];
  const base = {
    leadId: input.leadId ?? "pending",
    stateProfileId: input.state.id,
    countyProfileId: input.county?.id ?? null,
    workflowStage: "closing_scheduled" as WorkflowStage,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  };

  const closingDocs = input.documentChecklist.filter(
    (d) =>
      d.requiredByWorkflowStage.includes("closing_scheduled") &&
      d.requirementLevel === "required" &&
      !["uploaded", "signed", "reviewed", "generated"].includes(d.currentStatus)
  );
  for (const doc of closingDocs) {
    blockers.push({
      ...base,
      id: `blk-close-doc-${doc.id}`,
      blockerType: "closing_document",
      blockerMessage: `${doc.documentName} required before closing.`,
      requiredAction: `Complete ${doc.documentName}.`,
      severity: "blocking",
    });
  }

  if (riskLevel === "restricted") {
    blockers.push({
      ...base,
      id: "blk-close-restricted",
      blockerType: "restricted_closing",
      blockerMessage: "Closing blocked due to Restricted compliance risk.",
      requiredAction: "Resolve compliance restrictions before scheduling closing.",
      severity: "restricted",
    });
  }

  return blockers;
}

function buildExplanation(
  riskLevel: RiskRating,
  actions: string[],
  blockers: WorkflowBlocker[]
): string {
  const parts = [
    `Compliance risk level: ${riskLevel.replace(/_/g, " ")}.`,
    "EstateLeadOS cannot confirm legal compliance. Confirm with a qualified professional before proceeding.",
  ];
  if (actions.length) parts.push(`Required actions: ${actions.slice(0, 3).join("; ")}.`);
  if (blockers.length) parts.push(`${blockers.filter((b) => b.status === "active").length} active workflow blocker(s).`);
  return parts.join(" ");
}

export function getAcknowledgementText(type: AcknowledgementType): string {
  return ACKNOWLEDGEMENT_TEXTS[type] ?? ACKNOWLEDGEMENT_TEXTS.general_compliance;
}
