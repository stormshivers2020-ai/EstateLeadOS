import Link from "next/link";
import { ExecutiveMetricCard } from "@/components/ui/ExecutiveMetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DashboardAutomationBar } from "@/components/automation/DashboardAutomationBar";
import { NextBestActions } from "./NextBestActions";
import { ScsNovaBrand } from "@/components/brand/ScsNovaBrand";
import { PROFIT_DISCLAIMER } from "@/lib/constants/compliance-copy";
import { EMPTY_STATES } from "@/lib/constants/microcopy";
import { shouldLoadSeedData } from "@/lib/config/app-mode";
import type { DashboardMetrics } from "@/lib/types";
import {
  Activity, AlertTriangle, Building, Calendar, CheckCircle, ClipboardList,
  DollarSign, FileText, MapPin, Phone, Shield, Target, TrendingUp, Users,
} from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

interface DashboardWidgetsProps {
  metrics: DashboardMetrics;
}

export function DashboardWidgets({ metrics }: DashboardWidgetsProps) {
  const isDemo = shouldLoadSeedData();
  const healthVariant = metrics.dataSourceHealth === "healthy" ? "success" : metrics.dataSourceHealth === "degraded" ? "warning" : "danger";
  const systemVariant = metrics.systemStatus === "operational" ? "success" : "warning";

  const nextActions = isDemo
    ? [
        { id: "1", label: "Review high-score leads", count: metrics.highScoreLeads, href: "/lead-feed", priority: "high" as const },
        { id: "2", label: "Resolve compliance blockers", count: metrics.leadsNeedingComplianceReview, href: "/compliance", priority: "high" as const },
        { id: "3", label: "Complete required document packets", count: metrics.documentsPending, href: "/documents", priority: "normal" as const },
        { id: "4", label: "Follow up with contacts today", count: metrics.followUpsDue, href: "/outreach", priority: "normal" as const },
        { id: "5", label: "Match buyers to under-contract leads", count: metrics.leadsUnderContract, href: "/buyer-network", priority: "normal" as const },
        { id: "7", label: "Review automation approvals", href: "/automation?tab=approvals", priority: "high" as const },
        { id: "6", label: "Open workflow wizards", href: "/wizards", priority: "low" as const },
      ]
    : [
        { id: "fs1", label: "Run New Lead Intake Wizard", href: "/wizards/lead-intake", priority: "high" as const },
        { id: "fs2", label: "Configure state setup", href: "/wizards/state-setup", priority: "high" as const },
        { id: "fs3", label: "Import your first CSV", href: "/wizards/lead-intake", priority: "normal" as const },
        { id: "fs4", label: "Complete onboarding checklist", href: "/onboarding", priority: "normal" as const },
      ];

  return (
    <div className="space-y-8 premium-glow">
      <DashboardAutomationBar />
      {!isDemo && metrics.totalEstateLeads === 0 && (
        <Card className="border-emerald-800/30 bg-emerald-950/10">
          <CardContent className="py-5 text-center">
            <p className="font-medium text-emerald-200">{EMPTY_STATES.dashboardFresh.title}</p>
            <p className="mt-1 text-sm text-emerald-200/70">{EMPTY_STATES.dashboardFresh.description}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/onboarding" className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500">{EMPTY_STATES.dashboardFresh.primary}</Link>
              <Link href="/market-search" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">{EMPTY_STATES.dashboardFresh.secondary}</Link>
            </div>
          </CardContent>
        </Card>
      )}

      <SectionHeader
        title="Nova Executive Snapshot"
        subtitle="Your nationwide acquisition operation at a glance"
        action={<DashboardQuickActions />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveMetricCard title="Total Estate Leads" value={metrics.totalEstateLeads.toLocaleString()} explanation="Leads discovered via internet search and imports" href="/lead-feed" icon={Target} trend="up" trendLabel="+12% vs last period (placeholder)" />
        <ExecutiveMetricCard title="High Confidence Leads" value={metrics.highScoreLeads} explanation="Estate score 75+ — review recommended" href="/lead-feed" icon={CheckCircle} status={{ label: "Review", variant: "info" }} />
        <ExecutiveMetricCard title="Ready for Outreach" value={metrics.leadsReadyForOutreach} explanation="Contact-ready after compliance checks" href="/outreach" icon={Phone} />
        <ExecutiveMetricCard title="Compliance Blockers" value={metrics.leadsNeedingComplianceReview} explanation="Acknowledgement or review required" href="/compliance" icon={Shield} status={metrics.leadsNeedingComplianceReview > 0 ? { label: "Action", variant: "warning" } : { label: "Clear", variant: "success" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="Deal Pipeline" subtitle="Estimated spread — user-entered assumptions, not guaranteed profit" />
          <div className="grid gap-4 sm:grid-cols-2">
            <ExecutiveMetricCard title="Estimated Pipeline Spread" value={formatCurrency(metrics.estimatedPipelineSpread)} explanation="Projected assignment range based on active pipeline" href="/reports" icon={DollarSign} trend="neutral" trendLabel="Based on assumptions" />
            <ExecutiveMetricCard title="Active Assignments" value={metrics.assignmentSummary.active} explanation={`${metrics.assignmentSummary.closing} closing · ${metrics.assignmentSummary.closed} closed`} href="/assignments" icon={ClipboardList} />
            <ExecutiveMetricCard title="Documents Pending" value={metrics.documentsPending} explanation="Required packets incomplete" href="/documents" icon={FileText} />
            <ExecutiveMetricCard title="Follow-Ups Due" value={metrics.followUpsDue} explanation="Scheduled outreach today" href="/outreach" icon={Calendar} />
          </div>
          <p className="text-xs text-slate-500">{PROFIT_DISCLAIMER}</p>

          <SectionHeader title="Lead Intelligence" subtitle="Nova Intelligence Layer — geographic distribution" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-400" /> Leads by State</CardTitle></CardHeader>
              <CardContent>
                {metrics.leadsByState.length === 0 ? (
                  <p className="text-sm text-slate-400">No state data yet. <Link href="/market-search" className="text-sky-400 hover:underline">Select market</Link></p>
                ) : (
                  <ul className="space-y-2">{metrics.leadsByState.map((item) => (
                    <li key={item.state} className="flex justify-between text-sm"><span className="font-medium text-slate-200">{item.state}</span><span className="text-slate-400">{item.count}</span></li>
                  ))}</ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-4 w-4 text-sky-400" /> Leads by County</CardTitle></CardHeader>
              <CardContent>
                {metrics.leadsByCounty.length === 0 ? (
                  <p className="text-sm text-slate-400">No county data yet.</p>
                ) : (
                  <ul className="space-y-2">{metrics.leadsByCounty.map((item) => (
                    <li key={`${item.state}-${item.county}`} className="flex justify-between text-sm"><span className="text-slate-200">{item.county}, {item.state}</span><span className="text-slate-400">{item.count}</span></li>
                  ))}</ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <NextBestActions actions={nextActions} />

          <Card>
            <CardHeader><CardTitle>Buyer / Assignment Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Buyer matches (30d)</span><Link href="/buyer-network" className="font-medium text-sky-400">{metrics.buyerMatchingActivity}</Link></div>
              <div className="flex justify-between"><span className="text-slate-400">Document readiness</span><span className="text-slate-200">{metrics.documentReadinessPercent}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">New leads this week</span><span className="text-slate-200">{metrics.newLeadsThisWeek}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Source Health</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Data sources</span><Badge variant={healthVariant}>{metrics.dataSourceHealth}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-400">SCS Nova system</span><Badge variant={systemVariant}>{metrics.systemStatus}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-400">Markets</span><span className="text-slate-200">{metrics.supportedStates} states · {metrics.supportedCounties} counties</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Risk alerts</span><span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3.5 w-3.5" />{metrics.riskAlerts}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Under Contract</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-50">{metrics.leadsUnderContract}</p>
              <p className="mt-1 text-xs text-slate-400">Leads in active contract stages</p>
              <Link href="/assignments" className="mt-3 inline-block text-xs text-sky-400 hover:underline">View Assignment Tracker →</Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-slate-800/60 pt-6">
        <ScsNovaBrand variant="command" />
      </div>
    </div>
  );
}
