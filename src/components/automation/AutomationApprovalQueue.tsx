"use client";

import Link from "next/link";
import { useAutomation } from "./AutomationContext";
import { canRoleApprove, getAutomationState, type AutomationApproval } from "@/lib/automation";
import { getSessionContext } from "@/lib/config/session";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

const FILTER_OPTIONS = [
  "all", "my", "source", "compliance", "document", "outreach", "assignment", "payout", "rejected", "escalated", "completed",
] as const;

type Filter = (typeof FILTER_OPTIONS)[number];

function matchesFilter(approval: AutomationApproval, filter: Filter): boolean {
  if (filter === "all") return approval.status === "pending";
  if (filter === "my") return approval.status === "pending";
  if (filter === "source") return approval.approvalType === "source_approval";
  if (filter === "compliance") return approval.approvalType === "compliance_approval";
  if (filter === "document") return ["document_approval", "attorney_review_acknowledgement"].includes(approval.approvalType);
  if (filter === "outreach") return approval.approvalType === "outreach_approval";
  if (filter === "assignment") return approval.approvalType === "assignment_approval";
  if (filter === "payout") return approval.approvalType === "payout_readiness_approval";
  if (filter === "rejected") return approval.status === "rejected";
  if (filter === "escalated") return approval.status === "escalated";
  if (filter === "completed") return approval.status === "approved";
  return true;
}

export function AutomationApprovalQueue({ filter = "all" }: { filter?: Filter }) {
  const { pendingApprovals, approve, reject } = useAutomation();
  const session = getSessionContext();
  const allApprovals = getAutomationState().approvals;

  const items = (filter === "all" || filter === "my"
    ? pendingApprovals
    : allApprovals.filter((a) => matchesFilter(a, filter))
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[var(--nova-text-muted)]">
          No approvals in this queue. Automation will pause here when human approval is required.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((approval) => {
        const canApprove = canRoleApprove(session.role, approval);
        return (
          <Card key={approval.id} className="border-[var(--nova-border)]">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--nova-text-primary)]">{approval.approvalTitle}</p>
                  <p className="mt-1 text-xs text-[var(--nova-text-muted)]">{approval.approvalType.replace(/_/g, " ")}</p>
                </div>
                <Badge variant={approval.status === "pending" ? "warning" : approval.status === "approved" ? "success" : "danger"}>
                  {approval.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-[var(--nova-text-secondary)]">{approval.approvalDescription}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-[var(--nova-text-muted)]">
                <span>Risk: {approval.riskLevel}</span>
                <span>Role: {approval.requiredRole.replace(/_/g, " ")}</span>
                {approval.leadId && (
                  <Link href={`/leads/${approval.leadId}`} className="text-[var(--nova-blue)] hover:underline">Open lead</Link>
                )}
              </div>
              <p className="text-[10px] text-[var(--nova-text-muted)]">
                If approved: automation resumes from paused step. If rejected: automation stops.
              </p>
              {approval.status === "pending" && canApprove && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={() => approve(approval.id)} className="nova-btn-primary px-3 py-1.5 text-xs">
                    Approve and Resume
                  </button>
                  <button type="button" onClick={() => reject(approval.id)} className="rounded-lg border border-[rgba(255,94,94,0.3)] px-3 py-1.5 text-xs text-[var(--nova-red)]">
                    Reject
                  </button>
                </div>
              )}
              {approval.status === "pending" && !canApprove && (
                <p className="text-xs text-[var(--nova-orange)]">Permission required — {approval.requiredRole.replace(/_/g, " ")} role needed.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
