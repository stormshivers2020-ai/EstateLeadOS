"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AssignmentStageBadge } from "./DealWorkflowBadges";
import { Badge } from "@/components/ui/Badge";
import { ASSIGNMENT_RISK_WARNING, FINANCIAL_ESTIMATE_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { Assignment } from "@/lib/deal-calculator/dealCalculatorTypes";
import { getBuyerById } from "@/lib/services/buyers";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLatestCalculation } from "@/lib/services/deal-calculator";
import { getDealWorkflowAudit } from "@/lib/services/assignments";
import { validateAssignmentStage } from "@/lib/services/assignments";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function AssignmentDetailClient({ assignment }: { assignment: Assignment }) {
  const lead = getFullLeadByIdSync(assignment.leadId);
  const buyer = assignment.buyerId ? getBuyerById(assignment.buyerId) : null;
  const calc = getLatestCalculation(assignment.leadId);
  const audit = getDealWorkflowAudit(assignment.id);
  const [stageCheck, setStageCheck] = useState<ReturnType<typeof validateAssignmentStage> | null>(null);

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  const tryStage = (stage: typeof assignment.assignmentStage) => {
    setStageCheck(validateAssignmentStage(assignment.id, stage));
  };

  return (
    <div className="space-y-6">
      <Link href="/assignments" className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline">
        <ArrowLeft className="h-3 w-3" /> Back to Assignment Tracker
      </Link>

      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        {ASSIGNMENT_RISK_WARNING}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AssignmentStageBadge stage={assignment.assignmentStage} />
        {assignment.hasBlocker && <Badge variant="warning">Active Blockers</Badge>}
        <Badge variant="info">{assignment.complianceStatus}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{lead?.propertyAddress ?? "Assignment"}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="Seller/Owner" value={assignment.sellerName} />
              <Field label="Buyer" value={buyer?.buyerName ?? "—"} />
              <Field label="Original Purchase Price" value={fmt(assignment.originalPurchasePrice)} />
              <Field label="Buyer Assignment Price" value={fmt(assignment.buyerAssignmentPrice)} />
              <Field label="Estimated Assignment Spread" value={fmt(assignment.estimatedAssignmentSpread)} />
              <Field label="Actual Recorded Fee" value={fmt(assignment.actualAssignmentFee)} />
              <Field label="Earnest Money" value={fmt(assignment.earnestMoney)} />
              <Field label="Title Company" value={assignment.titleCompany ?? "—"} />
              <Field label="Closing Date" value={assignment.closingDate ?? "—"} />
              <Field label="Attorney/Title Review" value={assignment.attorneyTitleReviewStatus} />
            </CardContent>
          </Card>

          {calc && (
            <Card>
              <CardHeader><CardTitle>Related Deal Calculation</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <p>Est. spread from calculator: {fmt(calc.estimatedSpread)} — {calc.confidenceLevel} confidence</p>
                <Link href={`/deal-calculator?lead=${assignment.leadId}`} className="mt-2 inline-block text-xs text-sky-400 hover:underline">View calculations →</Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Disclosures & Documents</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p className="text-xs text-slate-500">Required disclosures:</p>
              <ul className="mt-1 list-inside list-disc text-slate-400">
                {assignment.requiredDisclosures.map((d) => <li key={d}>{d}</li>)}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Signed documents:</p>
              <ul className="mt-1 list-inside list-disc text-slate-400">
                {assignment.signedDocuments.length ? assignment.signedDocuments.map((d) => <li key={d}>{d}</li>) : <li>None yet</li>}
              </ul>
              <Link href={`/leads/${assignment.leadId}`} className="mt-2 inline-block text-xs text-sky-400 hover:underline">Open document packet →</Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Stage Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["assignment_terms_drafted", "assignment_sent", "closing_scheduled", "fee_recorded"].map((s) => (
                <button key={s} onClick={() => tryStage(s as typeof assignment.assignmentStage)} className="block w-full rounded border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 hover:border-sky-600">
                  Try move to: {s.replace(/_/g, " ")}
                </button>
              ))}
            </CardContent>
          </Card>

          {stageCheck && (
            <Card className={stageCheck.allowed ? "border-emerald-700/40" : "border-red-700/40"}>
              <CardContent className="py-4 text-sm">
                {stageCheck.allowed ? (
                  <p className="text-emerald-300">Stage change allowed (demo validation).</p>
                ) : (
                  <>
                    <p className="flex items-center gap-1 text-red-300"><AlertTriangle className="h-4 w-4" /> Blocked</p>
                    <p className="mt-1 text-xs text-red-200/80">{stageCheck.blockedReason}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {audit.map((e) => (
                <div key={e.id} className="border-b border-slate-800 pb-2 text-xs">
                  <p className="text-slate-300">{e.actionDescription}</p>
                  <p className="text-slate-500">{e.userName} · {new Date(e.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-slate-600">{FINANCIAL_ESTIMATE_DISCLAIMER}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  );
}
