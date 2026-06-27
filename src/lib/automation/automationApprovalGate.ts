import type { UserRoleId } from "@/lib/constants/roles";
import type { ApprovalType, AutomationApproval, ApprovalStatus } from "./automationTypes";

let approvalCounter = 0;

export function createApproval(params: {
  automationRunId: string;
  organizationId: string;
  leadId: string | null;
  approvalType: ApprovalType;
  approvalTitle: string;
  approvalDescription: string;
  relatedRecordType?: string | null;
  relatedRecordId?: string | null;
  riskLevel?: AutomationApproval["riskLevel"];
  requiredRole?: UserRoleId | "user";
}): AutomationApproval {
  approvalCounter += 1;
  const now = new Date().toISOString();
  return {
    id: `appr-${Date.now()}-${approvalCounter}`,
    automationRunId: params.automationRunId,
    organizationId: params.organizationId,
    leadId: params.leadId,
    approvalType: params.approvalType,
    approvalTitle: params.approvalTitle,
    approvalDescription: params.approvalDescription,
    relatedRecordType: params.relatedRecordType ?? null,
    relatedRecordId: params.relatedRecordId ?? null,
    riskLevel: params.riskLevel ?? "moderate",
    requiredRole: params.requiredRole ?? "user",
    status: "pending",
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function canRoleApprove(role: UserRoleId, approval: AutomationApproval): boolean {
  if (role === "scs_nova_super_admin") return true;
  if (role === "scs_nova_admin" && ["source_approval", "admin_override"].includes(approval.approvalType)) return true;
  if (role === "org_admin" && ["source_approval", "assignment_approval", "buyer_approval", "payout_readiness_approval"].includes(approval.approvalType)) return true;
  if (role === "compliance_reviewer" && ["compliance_approval", "document_approval", "attorney_review_acknowledgement", "outreach_approval"].includes(approval.approvalType)) return true;
  if (approval.requiredRole === "user" && ["solo_investor", "acquisition_manager", "team_member", "org_admin"].includes(role)) return true;
  if (approval.requiredRole === role) return true;
  return false;
}

export function pendingApprovalsForRun(approvals: AutomationApproval[], runId: string): AutomationApproval[] {
  return approvals.filter((a) => a.automationRunId === runId && a.status === "pending");
}

export function allRequiredApprovalsComplete(approvals: AutomationApproval[], runId: string): boolean {
  const pending = pendingApprovalsForRun(approvals, runId);
  return pending.length === 0;
}

export function updateApprovalStatus(
  approval: AutomationApproval,
  status: ApprovalStatus,
  userId: string,
  notes?: string
): AutomationApproval {
  const now = new Date().toISOString();
  return {
    ...approval,
    status,
    notes: notes ?? approval.notes,
    approvedBy: status === "approved" ? userId : approval.approvedBy,
    approvedAt: status === "approved" ? now : approval.approvedAt,
    rejectedBy: status === "rejected" ? userId : approval.rejectedBy,
    rejectedAt: status === "rejected" ? now : approval.rejectedAt,
    updatedAt: now,
  };
}
