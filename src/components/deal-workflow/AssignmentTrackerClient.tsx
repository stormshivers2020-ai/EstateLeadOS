"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { AssignmentStageBadge } from "./DealWorkflowBadges";
import { Badge } from "@/components/ui/Badge";
import { ASSIGNMENT_RISK_WARNING, FINANCIAL_ESTIMATE_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import { getAssignments, getAssignmentOverview } from "@/lib/services/assignments";
import { getBuyerById } from "@/lib/services/buyers";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { ClipboardList } from "lucide-react";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "compliance", label: "Needs Compliance" },
  { id: "closed", label: "Closed" },
];

interface AssignmentTrackerClientProps { isDemo: boolean }

export function AssignmentTrackerClient({ isDemo }: AssignmentTrackerClientProps) {
  const [view, setView] = useState("all");
  const overview = useMemo(() => getAssignmentOverview(), [isDemo]);
  const assignments = useMemo(() => getAssignments({ view }), [view, isDemo]);
  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  if (!isDemo) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No assignments being tracked"
        description="Assignments will appear here once a lead reaches Under Contract and buyer matching begins."
        primaryAction={{ label: "Open Lead Feed", href: "/lead-feed" }}
        learnHref="/guide"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        {ASSIGNMENT_RISK_WARNING}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Assignments" value={overview.total} />
        <StatCard title="Active" value={overview.active} />
        <StatCard title="Est. Pipeline Spread" value={fmt(overview.estimatedPipelineSpread)} subtitle="Projected range" />
        <StatCard title="Actual Fees Recorded" value={fmt(overview.actualFeesRecorded)} subtitle="Recorded outcomes" />
      </div>

      <p className="text-xs text-slate-500">{FINANCIAL_ESTIMATE_DISCLAIMER}</p>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} className={`rounded-lg border px-3 py-1.5 text-xs ${view === v.id ? "border-sky-600 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-400"}`}>
            {v.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Assignments ({assignments.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Property</th>
                  <th className="pb-2 pr-4">Buyer</th>
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 pr-4">Est. Spread</th>
                  <th className="pb-2 pr-4">Actual Fee</th>
                  <th className="pb-2 pr-4">Compliance</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const lead = getFullLeadByIdSync(a.leadId);
                  const buyer = a.buyerId ? getBuyerById(a.buyerId) : null;
                  return (
                    <tr key={a.id} className="border-b border-slate-800">
                      <td className="py-3 pr-4">
                        <p className="text-slate-200">{lead?.propertyAddress ?? a.leadId}</p>
                        {a.hasBlocker && <Badge variant="warning" className="mt-1">Blocker</Badge>}
                      </td>
                      <td className="py-3 pr-4 text-xs">{buyer?.buyerName ?? "—"}</td>
                      <td className="py-3 pr-4"><AssignmentStageBadge stage={a.assignmentStage} /></td>
                      <td className="py-3 pr-4 text-xs">{fmt(a.estimatedAssignmentSpread)}</td>
                      <td className="py-3 pr-4 text-xs">{fmt(a.actualAssignmentFee)}</td>
                      <td className="py-3 pr-4 text-xs capitalize">{a.complianceStatus.replace(/_/g, " ")}</td>
                      <td className="py-3">
                        <Link href={`/assignments/${a.id}`} className="text-xs text-sky-400 hover:underline">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
