import { MASTER_PROCESS_STEPS } from "@/lib/constants/process-steps";
import type { ProcessStepStatus, ProcessStepStatusRecord } from "@/lib/types/analytics";
import type { FullLeadDetail } from "@/lib/types/crm";

export function isVerifiedLead(lead: FullLeadDetail): boolean {
  return lead.dataConfidenceScore >= 75
    || ["contact_ready", "first_outreach_sent", "under_contract", "buyer_matching", "assignment_sent", "closing_scheduled", "closed_won"].includes(lead.pipelineStage);
}

export function leadNeedsManualReview(lead: FullLeadDetail): boolean {
  return lead.manualVerificationNeeded.length > 0 || lead.pipelineStage === "compliance_review";
}
import type { Assignment } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { LeadPacket } from "@/lib/types/program";
import type { AttorneyReview, DistributionPacket, EmailDistribution } from "@/lib/types/distribution";

export interface LeadProcessContext {
  lead: FullLeadDetail;
  assignment?: Assignment | null;
  packets?: LeadPacket[];
  attorneyReview?: AttorneyReview | null;
  distributionPacket?: DistributionPacket | null;
  emailDistribution?: EmailDistribution | null;
  hasCountyConfig?: boolean;
  pipelineRunCount?: number;
}

function statusForStep(stepNum: number, current: number, blocked?: boolean, approval?: boolean): ProcessStepStatus {
  if (blocked && stepNum === current) return "blocked";
  if (approval && stepNum === current) return "needs_approval";
  if (stepNum < current) return "complete";
  if (stepNum === current) return "in_progress";
  return "not_started";
}

export function inferLeadCurrentStep(ctx: LeadProcessContext): number {
  const { lead, assignment, packets = [], attorneyReview, distributionPacket, emailDistribution } = ctx;
  const stage = lead.pipelineStage;

  if (stage === "closed_won" || stage === "closed_lost" || stage === "dead_lead") return 23;
  if (stage === "closing_scheduled" || assignment?.assignmentStage === "closing_scheduled") return 21;
  if (stage === "assignment_sent" || assignment?.assignmentStage === "fee_recorded") return 20;
  if (assignment?.assignmentStage === "buyer_interest_confirmed" || stage === "buyer_matching") return 19;
  if (emailDistribution?.sendStatus === "sent" || emailDistribution?.sendStatus === "simulated") return 19;
  if (distributionPacket?.userApprovalStatus === "approved" || distributionPacket?.packetStatus === "approved_to_send") return 18;
  if (distributionPacket) return 17;
  if (attorneyReview?.approvedFileUrl || attorneyReview?.reviewStatus === "approved") return 16;
  if (attorneyReview?.reviewStatus === "sent_delivered_manually" || attorneyReview?.reviewStatus === "under_attorney_review") return 14;
  if (packets.some((p) => p.packetStatus === "archived")) return 13;
  if (packets.some((p) => p.packetStatus === "ready_for_internal_review")) return 13;
  if (packets.length > 0) return 12;
  if (isVerifiedLead(lead)) return 11;
  if (leadNeedsManualReview(lead) || stage === "compliance_review") return 10;
  if (lead.estateLeadScore >= 60) return 9;
  if (lead.propertyAddress) return 5;
  if (stage === "needs_research" || stage === "researching") return 4;
  if (stage === "new_lead") return 3;
  return 2;
}

export function buildLeadProcessSteps(ctx: LeadProcessContext, orgId: string): ProcessStepStatusRecord[] {
  const current = inferLeadCurrentStep(ctx);
  const now = new Date().toISOString();
  const blocked = ctx.lead.complianceRiskScore > 70 || ctx.assignment?.hasBlocker;
  const needsApproval = leadNeedsManualReview(ctx.lead)
    || ctx.distributionPacket?.userApprovalStatus === "pending";

  return MASTER_PROCESS_STEPS.map((step) => {
    let status = statusForStep(step.number, current, blocked, needsApproval);
    if (step.number === 13 && ctx.packets?.some((p) => p.packetStatus === "ready_for_internal_review")) {
      status = "ready_to_print";
    }
    if (step.number === 18 && (ctx.distributionPacket?.userApprovalStatus === "approved" || ctx.distributionPacket?.packetStatus === "approved_to_send")) {
      status = "ready_to_send";
    }
    if (step.number === 14 && ctx.attorneyReview?.reviewStatus === "under_attorney_review") {
      status = "needs_attorney_review";
    }
    if (ctx.lead.pipelineStage === "closed_lost" && step.number === current) {
      status = "rejected";
    }
    if (ctx.lead.pipelineStage === "closed_won" && step.number <= 23) {
      status = step.number < 23 ? "complete" : "archived";
    }

    return {
      id: `${ctx.lead.id}-step-${step.number}`,
      organizationId: orgId,
      leadId: ctx.lead.id,
      stepNumber: step.number,
      stepName: step.name,
      status,
      blockerCount: blocked && step.number === current ? 1 : 0,
      nextAction: step.actionLabel,
      relatedModule: step.module,
      relatedFinancialImpact: step.financialImpact ? ctx.assignment?.estimatedAssignmentSpread ?? null : null,
      completedAt: step.number < current ? now : null,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function aggregateStepCounts(records: ProcessStepStatusRecord[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const r of records) {
    if (r.status === "in_progress" || r.status === "blocked" || r.status === "needs_approval") {
      counts[r.stepNumber] = (counts[r.stepNumber] ?? 0) + 1;
    }
  }
  return counts;
}
