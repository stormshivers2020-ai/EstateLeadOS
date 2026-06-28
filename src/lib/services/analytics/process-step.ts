import {
  ATTORNEY_REVIEW_STEP_END,
  ATTORNEY_REVIEW_STEP_START,
  FINAL_OUTCOME_STEP,
  FIRST_ARCHIVE_STEP,
  FINAL_ARCHIVE_STEP,
  MASTER_PROCESS_STEPS,
} from "@/lib/constants/process-steps";
import type { ProcessStepStatus, ProcessStepStatusRecord } from "@/lib/types/analytics";
import type { FullLeadDetail } from "@/lib/types/crm";
import type { Assignment } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { LeadArchive, LeadPacket } from "@/lib/types/program";
import type { AttorneyReview, DistributionPacket, EmailDistribution } from "@/lib/types/distribution";
import { getRequiredDocuments } from "@/lib/services/program/local-store";

export function isVerifiedLead(lead: FullLeadDetail): boolean {
  return (
    lead.dataConfidenceScore >= 75
    || ["contact_ready", "first_outreach_sent", "under_contract", "buyer_matching", "assignment_sent", "closing_scheduled", "closed_won"].includes(
      lead.pipelineStage,
    )
  );
}

export function leadNeedsManualReview(lead: FullLeadDetail): boolean {
  return lead.manualVerificationNeeded.length > 0 || lead.pipelineStage === "compliance_review";
}

export interface LeadProcessContext {
  lead: FullLeadDetail;
  assignment?: Assignment | null;
  packets?: LeadPacket[];
  archives?: LeadArchive[];
  attorneyReview?: AttorneyReview | null;
  distributionPacket?: DistributionPacket | null;
  emailDistribution?: EmailDistribution | null;
  hasCountyConfig?: boolean;
  pipelineRunCount?: number;
  packetPrintCount?: number;
}

function statusForStep(
  stepNum: number,
  current: number,
  blocked?: boolean,
  manualReview?: boolean,
): ProcessStepStatus {
  if (blocked && stepNum === current) return "blocked";
  if (manualReview && stepNum === current) return "needs_manual_review";
  if (stepNum < current) return "complete";
  if (stepNum === current) return "in_progress";
  return "not_started";
}

function countDocuments(leadId: string) {
  const docs = getRequiredDocuments(leadId);
  const required = docs.filter((d) => d.requiredForPacket);
  const completed = required.filter((d) => ["found", "attached", "approved"].includes(d.status));
  return { required: required.length, completed: completed.length, docs };
}

function hasFirstArchive(ctx: LeadProcessContext): boolean {
  return (ctx.archives ?? []).some(
    (a) =>
      a.archiveStage === "initial_review"
      || (!a.archiveStage && (a.archiveStatus === "ready_for_review" || a.archiveStatus === "missing_documents")),
  );
}

function hasFinalArchive(ctx: LeadProcessContext): boolean {
  return (ctx.archives ?? []).some(
    (a) =>
      a.archiveStage === "final_attorney_reviewed"
      || a.archiveType === "attorney_title_review"
      || a.archiveStatus === "archived_closed"
      || a.archiveStatus === "final_approved",
  );
}

function getBlockerReason(stepNum: number, ctx: LeadProcessContext): string | null {
  const { lead, assignment } = ctx;
  if (lead.complianceRiskScore > 70 && [10, 11, 21].includes(stepNum)) {
    return "Elevated compliance risk — complete manual review before proceeding. Not legal approval.";
  }
  if (assignment?.hasBlocker && stepNum >= 24) {
    return "Assignment blocker recorded — resolve before closing or payout tracking.";
  }
  if (stepNum === 12 && !isVerifiedLead(lead)) {
    return "Lead is not review-ready — complete evidence proof chain and manual review first.";
  }
  if (stepNum === 14 && !(ctx.packets ?? []).some((p) => p.printableHtml)) {
    return "No printable acquisition packet — build the acquisition preparation packet first.";
  }
  if (stepNum === 15 && !hasFirstArchive(ctx) && !(ctx.packets ?? []).length) {
    return "Internal review packet not prepared — complete Steps 12–14 before attorney handoff.";
  }
  if (stepNum === 18 && ctx.attorneyReview && !ctx.attorneyReview.approvedFileUrl) {
    return "Attorney-reviewed file not uploaded — upload before final archive storage.";
  }
  if (stepNum === 21 && ctx.distributionPacket?.userApprovalStatus === "pending") {
    return "External sharing requires explicit user approval — not legal approval.";
  }
  return null;
}

export function inferLeadCurrentStep(ctx: LeadProcessContext): number {
  const { lead, assignment, packets = [], attorneyReview, distributionPacket, emailDistribution } = ctx;
  const stage = lead.pipelineStage;

  if (stage === "closed_won" || stage === "closed_lost" || stage === "dead_lead") return FINAL_OUTCOME_STEP;
  if (stage === "closing_scheduled" || assignment?.assignmentStage === "closing_scheduled") return 25;
  if (assignment?.assignmentStage === "fee_recorded") return 25;
  if (stage === "assignment_sent" || assignment?.assignmentStage === "assignment_sent") return 24;
  if (stage === "buyer_matching" && assignment) return 24;
  if (emailDistribution?.sendStatus === "sent" || emailDistribution?.sendStatus === "simulated") return 23;
  if (assignment?.assignmentStage === "buyer_interest_confirmed") return 23;
  if (
    distributionPacket?.userApprovalStatus === "approved"
    || distributionPacket?.packetStatus === "approved_to_send"
  ) {
    return 22;
  }
  if (distributionPacket?.userApprovalStatus === "pending" || distributionPacket) return 21;
  if (attorneyReview?.approvedFileUrl && !hasFinalArchive(ctx)) return FINAL_ARCHIVE_STEP;
  if (
    attorneyReview
    && (attorneyReview.reviewStatus === "approved" || attorneyReview.reviewStatus === "approved_with_notes")
    && !attorneyReview.approvedFileUrl
  ) {
    return 18;
  }
  if (
    attorneyReview
    && attorneyReview.attorneyFeeStatus !== "written_agreement_uploaded"
    && attorneyReview.attorneyFeeStatus !== "approved_by_attorney"
    && attorneyReview.attorneyFeeStatus !== "not_applicable"
    && ["under_attorney_review", "sent_delivered_manually", "approved_with_notes"].includes(attorneyReview.reviewStatus)
  ) {
    return 17;
  }
  if (
    attorneyReview?.reviewStatus === "under_attorney_review"
    || attorneyReview?.reviewStatus === "sent_delivered_manually"
  ) {
    return 16;
  }
  if (
    attorneyReview
    && (attorneyReview.reviewStatus === "not_started" || attorneyReview.reviewStatus === "packet_ready_for_attorney")
  ) {
    return 15;
  }
  if (packets.length > 0 && !attorneyReview && (hasFirstArchive(ctx) || packets.some((p) => p.printableHtml))) {
    if ((ctx.packetPrintCount ?? 0) === 0 && !hasFirstArchive(ctx)) return FIRST_ARCHIVE_STEP;
    return 15;
  }
  if (packets.some((p) => p.printableHtml) && !hasFirstArchive(ctx)) return FIRST_ARCHIVE_STEP;
  if (packets.length > 0) {
    const { required, completed } = countDocuments(lead.id);
    if (required > 0 && completed < required) return 13;
    return 12;
  }
  if (isVerifiedLead(lead)) return 11;
  if (leadNeedsManualReview(lead) || stage === "compliance_review") return 10;
  if (lead.estateLeadScore >= 60) return 9;
  if (lead.propertyAddress) return 5;
  if (stage === "needs_research" || stage === "researching") return 4;
  if (stage === "new_lead") return 3;
  if ((ctx.pipelineRunCount ?? 0) > 0) return 3;
  if (ctx.hasCountyConfig) return 2;
  return 1;
}

function applyStepOverrides(
  stepNum: number,
  base: ProcessStepStatus,
  ctx: LeadProcessContext,
): ProcessStepStatus {
  const { packets = [], attorneyReview, distributionPacket, lead } = ctx;

  if (stepNum === FIRST_ARCHIVE_STEP && packets.some((p) => p.printableHtml)) {
    if (hasFirstArchive(ctx)) return "archived";
    return "ready_to_print";
  }
  if (stepNum === 13 && packets.length > 0) {
    const { required, completed } = countDocuments(lead.id);
    if (required > completed) return "ready_to_upload";
    if (completed >= required && required > 0) return "complete";
  }
  if (stepNum === 18 && attorneyReview && !attorneyReview.approvedFileUrl) {
    return "ready_to_upload";
  }
  if (stepNum === FINAL_ARCHIVE_STEP && attorneyReview?.approvedFileUrl) {
    return hasFinalArchive(ctx) ? "archived" : "ready_for_archive";
  }
  if (stepNum === 21 && distributionPacket?.userApprovalStatus === "pending") {
    return "needs_manual_review";
  }
  if (stepNum === 22 && distributionPacket?.packetStatus === "approved_to_send") {
    return "ready_for_distribution";
  }
  if (stepNum >= ATTORNEY_REVIEW_STEP_START && stepNum <= ATTORNEY_REVIEW_STEP_END) {
    if (stepNum === 16 && attorneyReview?.reviewStatus === "under_attorney_review") return "needs_attorney_review";
    if (stepNum === 15 && !attorneyReview && base === "in_progress") return "ready_to_print";
  }
  if (lead.pipelineStage === "closed_lost" && stepNum === inferLeadCurrentStep(ctx)) {
    return "rejected";
  }
  if (lead.pipelineStage === "closed_won" && stepNum <= FINAL_OUTCOME_STEP) {
    return stepNum < FINAL_OUTCOME_STEP ? "complete" : "archived";
  }
  return base;
}

export function buildLeadProcessSteps(ctx: LeadProcessContext, orgId: string): ProcessStepStatusRecord[] {
  const current = inferLeadCurrentStep(ctx);
  const now = new Date().toISOString();
  const blocked = ctx.lead.complianceRiskScore > 70 || ctx.assignment?.hasBlocker;
  const needsManual = leadNeedsManualReview(ctx.lead) || ctx.distributionPacket?.userApprovalStatus === "pending";
  const docCounts = countDocuments(ctx.lead.id);
  const latestPacket = ctx.packets?.[0] ?? null;
  const blockerReason = getBlockerReason(current, ctx);

  return MASTER_PROCESS_STEPS.map((step) => {
    let status = statusForStep(step.number, current, blocked, needsManual && step.manualApprovalRequired);
    status = applyStepOverrides(step.number, status, ctx);

    const stepBlockerReason =
      status === "blocked" ? (getBlockerReason(step.number, ctx) ?? blockerReason) : null;
    const stepBlockerCount = stepBlockerReason ? 1 : blocked && step.number === current ? 1 : 0;

    let approvalStatus: string | null = null;
    if (step.manualApprovalRequired) {
      if (step.number < current) approvalStatus = "approved";
      else if (status === "needs_manual_review") approvalStatus = "pending";
      else if (step.number === current) approvalStatus = "required";
      else approvalStatus = "not_required_yet";
    }

    let attorneyReviewStatus: string | null = null;
    if (step.attorneyReviewRequired) {
      attorneyReviewStatus = ctx.attorneyReview?.reviewStatus ?? "not_started";
      if (step.number === 17) attorneyReviewStatus = ctx.attorneyReview?.attorneyFeeStatus ?? "not_discussed";
    }

    return {
      id: `${ctx.lead.id}-step-${step.number}`,
      organizationId: orgId,
      leadId: ctx.lead.id,
      packetId: latestPacket?.id ?? null,
      stepNumber: step.number,
      stepName: step.name,
      status,
      blockerCount: stepBlockerCount,
      blockerReason: stepBlockerReason,
      requiredDocumentsCount: docCounts.required,
      completedDocumentsCount: docCounts.completed,
      manualApprovalRequired: step.manualApprovalRequired ?? false,
      attorneyReviewRequired: step.attorneyReviewRequired ?? false,
      approvalStatus,
      attorneyReviewStatus,
      nextAction: step.actionLabel,
      relatedModule: step.module,
      relatedFinancialImpact: step.financialImpact ? ctx.assignment?.estimatedAssignmentSpread ?? null : null,
      completedAt: step.number < current ? now : null,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function buildGlobalProcessSteps(orgId: string, aggregateCounts?: Record<number, number>): ProcessStepStatusRecord[] {
  const now = new Date().toISOString();
  return MASTER_PROCESS_STEPS.map((step) => ({
    id: `global-step-${step.number}`,
    organizationId: orgId,
    leadId: "",
    packetId: null,
    stepNumber: step.number,
    stepName: step.name,
    status: "not_started" as ProcessStepStatus,
    blockerCount: aggregateCounts?.[step.number] ?? 0,
    blockerReason: null,
    requiredDocumentsCount: 0,
    completedDocumentsCount: 0,
    manualApprovalRequired: step.manualApprovalRequired ?? false,
    attorneyReviewRequired: step.attorneyReviewRequired ?? false,
    approvalStatus: step.manualApprovalRequired ? "required_at_gate" : null,
    attorneyReviewStatus: step.attorneyReviewRequired ? "not_started" : null,
    nextAction: step.actionLabel,
    relatedModule: step.module,
    relatedFinancialImpact: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
}

export function aggregateStepCounts(records: ProcessStepStatusRecord[]): Record<number, number> {
  const active: ProcessStepStatus[] = [
    "in_progress",
    "blocked",
    "needs_manual_review",
    "needs_attorney_review",
    "ready_to_print",
    "ready_to_upload",
    "ready_for_archive",
    "ready_for_distribution",
  ];
  const counts: Record<number, number> = {};
  for (const r of records) {
    if (active.includes(r.status)) {
      counts[r.stepNumber] = (counts[r.stepNumber] ?? 0) + 1;
    }
  }
  return counts;
}

export function getNextProcessStep(currentStep: number): number {
  return Math.min(currentStep + 1, FINAL_OUTCOME_STEP);
}
