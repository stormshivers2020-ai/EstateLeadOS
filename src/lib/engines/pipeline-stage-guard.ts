import { PIPELINE_STAGE_DEFINITIONS } from "@/lib/constants/pipeline-stages";
import { checkDocumentBlockers } from "@/lib/engines/document-workflow-blockers";
import type { CrmPipelineStage, PipelineStageChangeResult } from "@/lib/types/crm";
import type { ComplianceCheckResult } from "@/lib/types/compliance";
import type { DocumentRecord } from "@/lib/types/documents";

const COMPLIANCE_GATED_STAGES: CrmPipelineStage[] = [
  "under_contract",
  "buyer_matching",
  "assignment_sent",
  "closing_scheduled",
];

const DOCUMENT_GATED_STAGES: CrmPipelineStage[] = [
  "under_contract",
  "assignment_sent",
  "closing_scheduled",
];

const STAGE_TO_COMPLIANCE_CHECK: Partial<Record<CrmPipelineStage, string>> = {
  under_contract: "under_contract",
  buyer_matching: "buyer_matched",
  assignment_sent: "assignment_sent",
  closing_scheduled: "closing_scheduled",
  compliance_review: "under_contract",
};

export function validateStageChange(
  fromStage: CrmPipelineStage,
  toStage: CrmPipelineStage,
  options: {
    doNotContact: boolean;
    complianceCheck: ComplianceCheckResult | null;
    reason?: string;
    documents?: DocumentRecord[];
    leadId?: string;
  }
): PipelineStageChangeResult {
  const def = PIPELINE_STAGE_DEFINITIONS[toStage];
  const fromDef = PIPELINE_STAGE_DEFINITIONS[fromStage];

  if (options.doNotContact && toStage !== "do_not_contact" && !["dead_lead", "closed_lost", "closed_won"].includes(toStage)) {
    return {
      allowed: false,
      fromStage,
      toStage,
      blockedReason: "Lead is marked Do Not Contact. Outreach stages are blocked.",
      complianceMessage: null,
    };
  }

  if (!def.allowedPreviousStages.includes(fromStage) && fromStage !== toStage) {
    const alwaysAllowed: CrmPipelineStage[] = ["dead_lead", "do_not_contact", "closed_lost"];
    if (!alwaysAllowed.includes(toStage)) {
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: `Cannot move from ${fromDef.name} to ${def.name}. Check allowed transitions.`,
        complianceMessage: null,
      };
    }
  }

  if (COMPLIANCE_GATED_STAGES.includes(toStage)) {
    if (!options.complianceCheck) {
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: `Moving to ${def.name} requires a compliance check.`,
        complianceMessage: "Run Compliance Rules Engine check first.",
      };
    }

    if (options.complianceCheck.blockedStages.includes(STAGE_TO_COMPLIANCE_CHECK[toStage] as never)) {
      const activeBlockers = options.complianceCheck.activeBlockers.filter((b) => b.status === "active");
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: `${activeBlockers.length} active workflow blocker(s) prevent this stage change.`,
        complianceMessage: options.complianceCheck.explanation,
      };
    }

    if (options.complianceCheck.riskLevel === "restricted") {
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: "Compliance risk is Restricted. Stage change blocked until cleared.",
        complianceMessage: "Contact Compliance Reviewer or complete attorney review acknowledgement.",
      };
    }

    if (
      ["elevated", "high", "attorney_review_required"].includes(options.complianceCheck.riskLevel) &&
      !options.complianceCheck.answers.acknowledgementsComplete
    ) {
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: "Elevated compliance risk requires acknowledgement before proceeding.",
        complianceMessage: "Complete required compliance acknowledgements.",
      };
    }
  }

  if (toStage === "dead_lead" && !options.reason) {
    return {
      allowed: false,
      fromStage,
      toStage,
      blockedReason: "Dead lead reason is required.",
      complianceMessage: null,
    };
  }

  if (toStage === "do_not_contact" && !options.reason) {
    return {
      allowed: false,
      fromStage,
      toStage,
      blockedReason: "Do Not Contact reason is required.",
      complianceMessage: null,
    };
  }

  if (
    DOCUMENT_GATED_STAGES.includes(toStage) &&
    options.documents &&
    options.leadId
  ) {
    const docBlockers = checkDocumentBlockers(toStage, options.documents, options.leadId);
    if (docBlockers.length > 0) {
      return {
        allowed: false,
        fromStage,
        toStage,
        blockedReason: `${docBlockers.length} document workflow blocker(s) prevent this stage change.`,
        complianceMessage: docBlockers.map((b) => b.blockerMessage).join(" · "),
        documentBlockers: docBlockers,
      };
    }
  }

  return {
    allowed: true,
    fromStage,
    toStage,
    blockedReason: null,
    complianceMessage: null,
  };
}
