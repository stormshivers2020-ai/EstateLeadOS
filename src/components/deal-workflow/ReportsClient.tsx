"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorStateCard } from "@/components/ui/ErrorStateCard";
import { getErrorState } from "@/lib/constants/error-states";
import { ScsNovaBrand } from "@/components/brand/ScsNovaBrand";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FINANCIAL_REPORT_DISCLAIMER } from "@/lib/constants/compliance-copy";
import { getPhase6Reports } from "@/lib/services/reports";
import { BarChart3 } from "lucide-react";

export function ReportsClient({ isDemo }: { isDemo: boolean }) {
  const reports = getPhase6Reports();

  if (!isDemo) {
    return (
      <div className="space-y-6">
        <ErrorStateCard error={getErrorState("fresh_start_empty")!} />
        <EmptyState
          icon={BarChart3}
          title="Reports"
          description="Reports populate as you add leads, buyers, calculations, assignments, and outreach activity."
        />
        <Card>
          <CardHeader><CardTitle>Available Report Categories</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-xs text-slate-500">
            {reports.reportFilters.map((f) => (
              <span key={f} className="rounded border border-slate-700 px-2 py-1">{f}</span>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Executive Reports" subtitle="Pipeline, compliance, and licensing metrics for acquisition teams" />

      <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
        {reports.disclaimer}
      </div>
      <p className="text-xs text-slate-500">{reports.financialReportDisclaimer ?? FINANCIAL_REPORT_DISCLAIMER}</p>
      <div className="rounded-lg border border-sky-700/40 bg-sky-900/20 px-4 py-2 text-sm text-sky-200">
        Demo sample values — fictional data for demonstration.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.metrics.map((m) => (
          <StatCard key={m.id} title={m.label} value={m.value} subtitle={m.note} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Pipeline Status</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(reports.pipelineStages).map(([stage, count]) => (
                <li key={stage} className="flex justify-between">
                  <span className="text-slate-400">{stage.replace(/_/g, " ")}</span>
                  <span className="text-slate-200">{count as number}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {reports.leadsBySource.map((row) => (
                <li key={row.source} className="flex justify-between">
                  <span className="text-slate-400">{row.source.replace(/_/g, " ")}</span>
                  <span className="text-slate-200">{row.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads by County</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(reports.leadsByCounty).map(([county, count]) => (
                <li key={county} className="flex justify-between">
                  <span className="text-slate-400">{county}</span>
                  <span className="text-slate-200">{count as number}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assignment Stages</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(reports.stageDistribution).map(([stage, count]) => (
                <li key={stage} className="flex justify-between">
                  <span className="text-slate-400">{stage.replace(/_/g, " ")}</span>
                  <span className="text-slate-200">{count as number}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plan Usage</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {reports.usageSummary.map((u) => (
                <li key={u.id} className="flex justify-between">
                  <span className="text-slate-400">{u.usageType.replace(/_/g, " ")}</span>
                  <span className="text-slate-200">{u.count} / {u.relatedPlanLimit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Support &amp; Audit</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Support tickets</span><span className="text-slate-200">{reports.supportTicketCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Audit events</span><span className="text-slate-200">{reports.auditEventCount}</span></div>
          </CardContent>
        </Card>
      </div>

      <SectionHeader title="Report Filters" subtitle="Date range, market, plan, and compliance context" />
      <Card>
        <CardContent className="flex flex-wrap gap-2 py-4 text-xs text-slate-500">
          {reports.reportFilters.map((f) => (
            <span key={f} className="rounded-full border border-slate-700 px-3 py-1">{f}</span>
          ))}
        </CardContent>
      </Card>

      <div className="border-t border-slate-800/60 pt-6 space-y-2">
        <ScsNovaBrand variant="report" />
        <p className="text-center text-xs text-slate-600">
          Reports may include estimated values, user-entered assumptions, and system-generated scores. EstateLeadOS does not guarantee financial outcomes.
        </p>
      </div>
    </div>
  );
}
