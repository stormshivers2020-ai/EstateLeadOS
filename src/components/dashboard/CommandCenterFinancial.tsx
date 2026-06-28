import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { DealCommandStepper } from "@/components/deal-command/DealCommandStepper";
import { getNextProcessStep } from "@/lib/services/analytics/process-step";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import { NextBestActions } from "@/components/dashboard/NextBestActions";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";
import {
  DollarSign, Wallet, TrendingUp, MapPin, GitBranch, AlertTriangle, BarChart3,
} from "lucide-react";

interface CommandCenterFinancialProps {
  analytics: CommandCenterAnalytics;
}

export function CommandCenterFinancial({ analytics }: CommandCenterFinancialProps) {
  const { snapshot, bottlenecks, nextStep, commandCenterSteps } = analytics;

  const nextActions = [
    ...commandCenterSteps.slice(0, 5).map((s) => ({
      id: `cc-${s.step}`,
      label: `Step ${s.step}: ${s.label}`,
      href: s.href,
      priority: (s.step === nextStep.step ? "high" : "normal") as "high" | "normal",
    })),
    { id: "cc-pl", label: "Review Profit & Loss", href: "/analytics/profit-loss", priority: "normal" as const },
    { id: "cc-acc", label: "Review Accrued Money", href: "/analytics/accrued-money", priority: "high" as const },
  ];

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />

      <SectionHeader
        title="Financial Snapshot"
        subtitle="Estimated pipeline, accrued money, received money, and net P/L — clearly labeled"
        action={<Link href="/analytics" className="text-sm text-[var(--nova-gold)] hover:underline">Open Analytics Center →</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Est. Pipeline Value" value={formatCurrency(snapshot.estimatedPipelineValue)} explanation="Based on assumptions — not guaranteed" moneyLabel="estimated" icon={TrendingUp} />
        <AnalyticsMetricCard title="Accrued Money" value={formatCurrency(snapshot.totalAccruedMoney)} explanation="Not received" moneyLabel="accrued" icon={Wallet} />
        <AnalyticsMetricCard title="Pending Payout" value={formatCurrency(snapshot.totalPendingPayout)} explanation="Awaiting confirmation" moneyLabel="pending" icon={DollarSign} />
        <AnalyticsMetricCard title="Received Money" value={formatCurrency(snapshot.totalReceivedMoney)} explanation="Manually recorded" moneyLabel="received" icon={DollarSign} />
        <AnalyticsMetricCard title="Expenses (Paid)" value={formatCurrency(snapshot.totalExpenses)} explanation="Recorded paid costs" moneyLabel="received" icon={BarChart3} />
        <AnalyticsMetricCard title="Net Profit / Loss" value={formatCurrency(snapshot.netProfitLoss)} explanation="Received minus paid expenses" moneyLabel="system_calculated" icon={TrendingUp} />
        <AnalyticsMetricCard title="Projected P / L" value={formatCurrency(snapshot.projectedProfitLoss)} explanation="Estimated fees minus expenses" moneyLabel="projected" icon={TrendingUp} />
        <AnalyticsMetricCard title="Target Assignment Fees" value={formatCurrency(snapshot.totalTargetAssignmentFees)} explanation="User-entered targets" moneyLabel="user_entered" icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="Deal Command Wizard" subtitle="Step 1 is always first — current and next step clearly marked" />
          <DealCommandStepper
            aggregateCounts={analytics.stepCounts}
            currentStep={nextStep.step}
            nextStep={getNextProcessStep(nextStep.step)}
            compact
          />

          <SectionHeader title="Pipeline Value & Performance Zones" subtitle="County, source, packet, attorney, buyer, assignment analytics" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "County Performance", href: "/analytics/county", icon: MapPin },
              { label: "Lead Source Performance", href: "/analytics/sources", icon: GitBranch },
              { label: "Packet + Archive", href: "/analytics/packets", icon: BarChart3 },
              { label: "Attorney Review", href: "/analytics/attorney", icon: AlertTriangle },
              { label: "Buyer Distribution", href: "/analytics/distribution", icon: GitBranch },
              { label: "Assignment & Payout", href: "/analytics/assignment", icon: Wallet },
            ].map((z) => (
              <Link key={z.href} href={z.href} className="premium-panel flex items-center gap-3 rounded-xl p-4 hover:border-[var(--nova-gold-muted)]">
                <z.icon className="h-4 w-4 text-[var(--nova-gold)]" />
                <span className="text-sm text-slate-200">{z.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <NextBestActions actions={nextActions} />

          {bottlenecks.length > 0 && (
            <Card className="premium-panel border-red-900/30">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-red-300">Bottlenecks & Blockers</p>
                <ul className="mt-2 space-y-2 text-xs text-slate-400">
                  {bottlenecks.map((b) => (
                    <li key={b.stage} className="flex justify-between">
                      <span>{b.stage}</span>
                      <span className="text-amber-400">{b.count}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/analytics/pipeline" className="mt-3 inline-block text-xs text-sky-400 hover:underline">View Pipeline Analytics →</Link>
              </CardContent>
            </Card>
          )}

          <Card className="premium-panel nova-glow-gold">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--nova-gold)]">Start Here</p>
              <p className="mt-1 text-sm font-medium text-slate-100">Step 1 — Select State / County</p>
              <Link href="/government-pipeline" className="mt-3 inline-block rounded-lg bg-[var(--nova-gold-muted)] px-3 py-1.5 text-xs text-[var(--nova-gold-soft)] hover:bg-[var(--nova-gold-muted)]">
                Configure County →
              </Link>
              <p className="mt-4 text-xs uppercase tracking-wider text-amber-400">Next Step</p>
              <p className="mt-1 text-sm text-slate-300">Step {nextStep.step} — {nextStep.label}</p>
              <Link href={nextStep.href} className="mt-2 inline-block text-xs text-sky-400 hover:underline">Take action →</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
