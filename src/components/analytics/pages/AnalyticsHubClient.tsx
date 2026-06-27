"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import {
  DollarSign, MapPin, GitBranch, Wallet, BarChart3, FileStack,
} from "lucide-react";

interface AnalyticsHubClientProps {
  data: CommandCenterAnalytics;
}

export function AnalyticsHubClient({ data }: AnalyticsHubClientProps) {
  const { snapshot, bottlenecks, commandCenterSteps, nextStep } = data;

  const zones = [
    { title: "Profit & Loss", href: "/analytics/profit-loss", icon: DollarSign, desc: "Revenue, expenses, net P/L" },
    { title: "Accrued Money", href: "/analytics/accrued-money", icon: Wallet, desc: "Accrued vs received tracking" },
    { title: "Pipeline", href: "/analytics/pipeline", icon: GitBranch, desc: "Stage conversion & bottlenecks" },
    { title: "County Performance", href: "/analytics/county", icon: MapPin, desc: "ROI by county" },
    { title: "Source Performance", href: "/analytics/sources", icon: BarChart3, desc: "Official vs enrichment sources" },
    { title: "Packets & Archive", href: "/analytics/packets", icon: FileStack, desc: "Packet readiness analytics" },
  ];

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer />

      <SectionHeader
        title="SCS Nova Analytics Center"
        subtitle="Financial, pipeline, packet, and assignment-readiness command analytics"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Est. Pipeline" value={formatCurrency(snapshot.estimatedPipelineValue)} explanation="Estimated pipeline value" moneyLabel="estimated" icon={DollarSign} />
        <AnalyticsMetricCard title="Accrued (Unpaid)" value={formatCurrency(snapshot.totalAccruedMoney)} explanation="Not received" moneyLabel="accrued" icon={Wallet} />
        <AnalyticsMetricCard title="Received" value={formatCurrency(snapshot.totalReceivedMoney)} explanation="Confirmed payments" moneyLabel="received" icon={DollarSign} />
        <AnalyticsMetricCard title="Net P / L" value={formatCurrency(snapshot.netProfitLoss)} explanation="Actual received minus paid expenses" moneyLabel="system_calculated" icon={BarChart3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((z) => (
          <Link key={z.href} href={z.href} className="premium-panel group rounded-xl border border-slate-700/50 p-5 transition hover:border-[var(--nova-gold-muted)]">
            <z.icon className="h-5 w-5 text-[var(--nova-gold)]" />
            <p className="mt-3 font-semibold text-slate-100 group-hover:text-[var(--nova-gold-soft)]">{z.title}</p>
            <p className="mt-1 text-xs text-slate-400">{z.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProcessStepMap aggregateCounts={data.stepCounts} currentStep={nextStep.step} nextStep={nextStep.step} compact />
        <div className="space-y-4">
          <SectionHeader title="Start Here — Command Flow" subtitle="15-step operating sequence" />
          <Card className="premium-panel">
            <CardContent className="space-y-2 p-4">
              {commandCenterSteps.map((s) => (
                <Link
                  key={s.step}
                  href={s.href}
                  className="flex items-center justify-between rounded-lg border border-slate-700/40 px-3 py-2 text-sm hover:border-[var(--nova-gold-muted)]"
                >
                  <span>
                    <span className="text-slate-500">Step {s.step}</span> — {s.label}
                  </span>
                  {s.step === 1 && <span className="text-[10px] uppercase text-emerald-400">Start Here</span>}
                  {s.step === nextStep.step && s.step !== 1 && <span className="text-[10px] uppercase text-amber-400">Next</span>}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {bottlenecks.length > 0 && (
        <>
          <SectionHeader title="Bottlenecks & Blockers" subtitle="Operational friction points" />
          <AnalyticsBarChart
            title="Active Bottlenecks"
            explanation="Stages where work is stuck"
            data={bottlenecks.map((b) => ({ label: b.stage, value: b.count }))}
            horizontal
          />
        </>
      )}

      <AnalyticsLineChart
        title="Accrued vs Received Trend"
        explanation="Monthly accrued (gold) vs received (blue)"
        data={data.assignmentMetrics.accruedVsReceived}
        valueLabel="Accrued"
        secondaryLabel="Received"
        moneyLabel="accrued / received"
      />
    </div>
  );
}
