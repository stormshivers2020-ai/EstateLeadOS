"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AssignmentStageBadge } from "./DealWorkflowBadges";
import { ASSIGNMENT_RISK_WARNING } from "@/lib/deal-calculator/dealCalculatorTypes";
import { getAssignmentForLead } from "@/lib/services/assignments";
import { getBuyerById } from "@/lib/services/buyers";
import type { FullLeadDetail } from "@/lib/types/crm";
import { ClipboardList, AlertTriangle } from "lucide-react";

export function AssignmentTrackerPanel({ lead, isDemo }: { lead: FullLeadDetail; isDemo: boolean }) {
  const assignment = isDemo ? getAssignmentForLead(lead.id) : null;
  const buyer = assignment?.buyerId ? getBuyerById(assignment.buyerId) : null;
  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-sky-400" />
          Assignment Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!isDemo || !assignment ? (
          <p className="text-slate-400">No assignment record yet. Create from Assignment Tracker when under contract.</p>
        ) : (
          <>
            <AssignmentStageBadge stage={assignment.assignmentStage} />
            {assignment.hasBlocker && (
              <p className="flex items-center gap-1 text-xs text-amber-300">
                <AlertTriangle className="h-3 w-3" /> Active blockers — review compliance and documents
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div><span className="text-slate-500">Buyer:</span> <span className="text-slate-200">{buyer?.buyerName ?? "—"}</span></div>
              <div><span className="text-slate-500">Est. spread:</span> <span className="text-slate-200">{fmt(assignment.estimatedAssignmentSpread)}</span></div>
              <div><span className="text-slate-500">Actual fee:</span> <span className="text-slate-200">{fmt(assignment.actualAssignmentFee)}</span></div>
              <div><span className="text-slate-500">Title:</span> <span className="text-slate-200">{assignment.titleCompany ?? "—"}</span></div>
              <div><span className="text-slate-500">Compliance:</span> <span className="text-slate-200">{assignment.complianceStatus}</span></div>
              <div><span className="text-slate-500">Closing:</span> <span className="text-slate-200">{assignment.closingDate ?? "—"}</span></div>
            </div>
            <Link href={`/assignments/${assignment.id}`} className="text-sm text-sky-400 hover:underline">
              Open Assignment →
            </Link>
          </>
        )}
        <p className="text-xs text-slate-600">{ASSIGNMENT_RISK_WARNING}</p>
      </CardContent>
    </Card>
  );
}
