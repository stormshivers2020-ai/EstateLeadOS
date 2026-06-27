import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";

const p = () => getDataProvider();
import { validateAssignmentStageChange } from "@/lib/engines/assignment-workflow-guard";
import type { Assignment, AssignmentStage, AssignmentStageChange, DealWorkflowAuditLog } from "@/lib/deal-calculator/dealCalculatorTypes";
import {
  DEMO_DEAL_WORKFLOW_AUDIT,
} from "@/lib/seed/demo-deal-workflow";
import { getBuyerById } from "@/lib/services/buyers";
import { getDocuments } from "@/lib/services/documents";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadComplianceContext, runLeadComplianceCheck } from "@/lib/services/compliance";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";

export function getAssignments(filters?: {
  leadId?: string;
  stage?: AssignmentStage;
  view?: string;
}): Assignment[] {
  let items = shouldLoadSeedData() ? [...p().dealWorkflow.getAssignments()] : [];

  if (filters?.leadId) items = items.filter((a) => a.leadId === filters.leadId);
  if (filters?.stage) items = items.filter((a) => a.assignmentStage === filters.stage);
  if (filters?.view === "active") {
    items = items.filter((a) => !["closed", "fee_recorded", "cancelled"].includes(a.assignmentStage));
  }
  if (filters?.view === "compliance") {
    items = items.filter((a) => a.complianceStatus === "needs_review" || a.hasBlocker);
  }
  if (filters?.view === "closed") {
    items = items.filter((a) => ["closed", "fee_recorded"].includes(a.assignmentStage));
  }

  return items;
}

export function getAssignmentById(id: string): Assignment | null {
  return getAssignments().find((a) => a.id === id) ?? null;
}

export function getAssignmentForLead(leadId: string): Assignment | null {
  return getAssignments({ leadId })[0] ?? null;
}

export function getDealWorkflowAudit(assignmentId?: string): DealWorkflowAuditLog[] {
  const logs = shouldLoadSeedData() ? DEMO_DEAL_WORKFLOW_AUDIT : [];
  return assignmentId ? logs.filter((l) => l.assignmentId === assignmentId) : logs;
}

export function validateAssignmentStage(
  assignmentId: string,
  toStage: AssignmentStage
): AssignmentStageChange {
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return {
      id: `asc-fail`, organizationId: "demo-org", assignmentId, leadId: "",
      userId: "demo-user", fromStage: "lead_under_contract", toStage,
      allowed: false, blockedReason: "Assignment not found", createdAt: new Date().toISOString(),
    };
  }

  const lead = getFullLeadByIdSync(assignment.leadId);
  const buyer = assignment.buyerId ? getBuyerById(assignment.buyerId) : null;
  const documents = getDocuments({ leadId: assignment.leadId });
  const ctx = getLeadComplianceContext(assignment.leadId);

  let complianceCheck = null;
  if (lead && ctx) {
    complianceCheck = runLeadComplianceCheck({
      stateAbbr: lead.state,
      countyName: lead.county,
      dealType: (ctx.dealType ?? "assignment_of_contract") as DealType,
      acquisitionStrategy: (ctx.acquisitionStrategy ?? "assignment") as AcquisitionStrategy,
      leadId: assignment.leadId,
      ownerIdentityVerified: ctx.ownerIdentityVerified,
      sourceDocumentsAttached: ctx.sourceDocumentsAttached,
      communicationLogActive: true,
      acknowledgementsComplete: ctx.acknowledgements.length > 0,
    });
  }

  const result = validateAssignmentStageChange(
    assignment.assignmentStage,
    toStage,
    {
      assignment,
      buyer,
      documents,
      complianceCheck,
      leadUnderContract: ["under_contract", "buyer_matching", "assignment_sent", "closing_scheduled", "closed_won"].includes(lead?.pipelineStage ?? "") || assignment.assignmentStage !== "lead_under_contract",
    }
  );

  return {
    id: `asc-${Date.now()}`,
    organizationId: assignment.organizationId,
    assignmentId,
    leadId: assignment.leadId,
    userId: "demo-user",
    fromStage: assignment.assignmentStage,
    toStage,
    allowed: result.allowed,
    blockedReason: result.blockedReason,
    createdAt: new Date().toISOString(),
  };
}

export function getAssignmentOverview() {
  const items = getAssignments();
  return {
    total: items.length,
    active: items.filter((a) => !["closed", "fee_recorded", "cancelled"].includes(a.assignmentStage)).length,
    estimatedPipelineSpread: items.reduce((s, a) => s + (a.estimatedAssignmentSpread ?? 0), 0),
    actualFeesRecorded: items.reduce((s, a) => s + (a.actualAssignmentFee ?? 0), 0),
    withBlockers: items.filter((a) => a.hasBlocker).length,
  };
}
