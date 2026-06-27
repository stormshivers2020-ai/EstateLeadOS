"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { StageConversionBar } from "@/components/analytics/charts/StageConversionBar";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import { ACCRUED_MONEY_WARNING, PAYOUT_WARNING } from "@/lib/types/analytics";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import {
  DollarSign, TrendingUp, Wallet, Receipt, PiggyBank, AlertTriangle,
} from "lucide-react";

interface ProfitLossClientProps {
  data: CommandCenterAnalytics;
}

export function ProfitLossClient({ data }: ProfitLossClientProps) {
  const { snapshot, monthly, countyRows, expenseByCategory, outcomeDistribution, dealLevelPnL } = data;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />

      <SectionHeader title="Executive Summary" subtitle="Actual vs estimated — never mixed" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Est. Pipeline Value" value={formatCurrency(snapshot.estimatedPipelineValue)} explanation="Could happen based on assumptions" moneyLabel="estimated" icon={TrendingUp} />
        <AnalyticsMetricCard title="Target Assignment Fees" value={formatCurrency(snapshot.totalTargetAssignmentFees)} explanation="User-entered target fees" moneyLabel="user_entered" icon={DollarSign} />
        <AnalyticsMetricCard title="Accrued Money" value={formatCurrency(snapshot.totalAccruedMoney)} explanation="Earned/expected — not received" moneyLabel="accrued" icon={Wallet} />
        <AnalyticsMetricCard title="Pending Payout" value={formatCurrency(snapshot.totalPendingPayout)} explanation="Awaiting confirmation" moneyLabel="pending" icon={PiggyBank} />
        <AnalyticsMetricCard title="Received Money" value={formatCurrency(snapshot.totalReceivedMoney)} explanation="Manually recorded payments only" moneyLabel="received" icon={DollarSign} />
        <AnalyticsMetricCard title="Expenses (Paid)" value={formatCurrency(snapshot.totalExpenses)} explanation="Recorded paid costs" moneyLabel="received" icon={Receipt} />
        <AnalyticsMetricCard title="Net Profit / Loss" value={formatCurrency(snapshot.netProfitLoss)} explanation="Received minus paid expenses" moneyLabel="system_calculated" icon={TrendingUp} />
        <AnalyticsMetricCard title="Projected P / L" value={formatCurrency(snapshot.projectedProfitLoss)} explanation="Estimated fees minus estimated expenses" moneyLabel="projected" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Avg Assignment Fee" value={formatCurrency(snapshot.averageAssignmentFee)} explanation="Estimated average" moneyLabel="estimated" />
        <AnalyticsMetricCard title="Cost / Verified Lead" value={formatCurrency(snapshot.costPerVerifiedLead)} explanation="Paid expenses per verified lead" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Cost / Closed Deal" value={formatCurrency(snapshot.costPerClosedDeal)} explanation="Paid expenses per closed deal" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Win / Loss Rate" value={`${formatPercent(snapshot.winRate)} / ${formatPercent(snapshot.lossRate)}`} explanation="Closed outcomes ratio" moneyLabel="system_calculated" />
      </div>

      <SectionHeader title="Trend Charts" subtitle="Monthly financial movement" />
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Monthly Est. Pipeline" explanation="Target assignment fees by month" data={monthly.pipeline} valueLabel="Pipeline" moneyLabel="estimated" />
        <AnalyticsLineChart title="Monthly Accrued Money" explanation="Accrued amounts by accrual date" data={monthly.accrued} valueLabel="Accrued" moneyLabel="accrued" />
        <AnalyticsLineChart title="Monthly Received Money" explanation="Manually recorded receipts" data={monthly.received} valueLabel="Received" moneyLabel="received" />
        <AnalyticsLineChart title="Monthly Expenses" explanation="Expense dates — paid and planned" data={monthly.expense} valueLabel="Expenses" moneyLabel="received" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsBarChart title="Profit by County" explanation="Net P/L = received minus expenses" data={countyRows.map((r) => ({ label: `${r.county}`, value: r.netProfitLoss }))} formatAsCurrency horizontal moneyLabel="system_calculated" />
        <AnalyticsPieChart title="Expense Breakdown" explanation="By category" data={expenseByCategory} moneyLabel="received" />
        <AnalyticsPieChart title="Lead Outcome Distribution" explanation="Pipeline vs closed outcomes" data={outcomeDistribution} />
        <StageConversionBar title="Lead Conversion by Step" explanation="Where leads are active in the master process" data={data.funnelSteps} />
      </div>

      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardContent className="flex gap-2 py-3 text-xs text-amber-200/90">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {ACCRUED_MONEY_WARNING} · {PAYOUT_WARNING}
        </CardContent>
      </Card>

      <AnalyticsTable
        title="Deal-Level P&L"
        explanation="Full deal financial records — estimated vs actual separated"
        rows={dealLevelPnL}
        columns={[
          { key: "address", header: "Deal" },
          { key: "county", header: "County" },
          { key: "targetFee", header: "Target Fee", render: (r) => formatCurrency(r.targetFee as number) },
          { key: "accrued", header: "Accrued", render: (r) => formatCurrency(r.accrued as number) },
          { key: "received", header: "Received", render: (r) => formatCurrency(r.received as number) },
          { key: "expenses", header: "Expenses", render: (r) => formatCurrency(r.expenses as number) },
          { key: "actual", header: "Net P/L", render: (r) => formatCurrency(r.actual as number) },
          { key: "status", header: "Status" },
        ]}
      />
    </div>
  );
}
