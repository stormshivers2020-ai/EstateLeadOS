"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import { PAYOUT_WARNING } from "@/lib/types/analytics";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

export function AssignmentAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const a = data.assignmentMetrics;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardContent className="flex gap-2 py-3 text-sm text-amber-200/90">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {PAYOUT_WARNING}
        </CardContent>
      </Card>

      <SectionHeader title="Assignment & Payout Readiness" subtitle="Fee targets, accrual, and payout tracking" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Assignments" value={String(a.total)} explanation="Active assignment records" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Avg Target Fee" value={formatCurrency(a.avgTargetFee)} explanation="Average target assignment fee" moneyLabel="user_entered" />
        <AnalyticsMetricCard title="Avg Agreed Fee" value={formatCurrency(a.avgAgreedFee)} explanation="Agreed assignment fees" moneyLabel="accrued" />
        <AnalyticsMetricCard title="Fees Recorded" value={String(a.feeRecorded)} explanation="Actual fees entered" moneyLabel="user_entered" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Accrued vs Received" explanation="Monthly accrued vs received money" data={a.accruedVsReceived} valueLabel="Accrued" secondaryLabel="Received" moneyLabel="accrued / received" />
        <AnalyticsBarChart title="Assignment Fees by Stage" explanation="Assignment stage distribution" data={a.byStage} horizontal />
        <AnalyticsPieChart title="Payout Readiness Status" explanation="Payout pipeline status" data={a.payoutStatus} moneyLabel="pending" />
        <AnalyticsBarChart title="Accrued Money Aging" explanation="Days past expected payout" data={a.agingAccrued.map((x) => ({ label: x.label, value: x.value }))} formatAsCurrency horizontal moneyLabel="accrued" />
      </div>

      <ProcessStepMap aggregateCounts={data.stepCounts} currentStep={22} compact />

      <AnalyticsTable
        title="Accrued Aging Report"
        explanation="Deal-level accrued amounts awaiting payout confirmation"
        rows={data.accrued.filter((x) => x.payoutStatus !== "received")}
        columns={[
          { key: "leadId", header: "Lead" },
          { key: "accruedAmount", header: "Accrued", render: (r) => formatCurrency(r.accruedAmount as number) },
          { key: "payoutStatus", header: "Payout Status" },
          { key: "expectedPayoutDate", header: "Expected Date" },
          { key: "buyerName", header: "Buyer" },
        ]}
      />
    </div>
  );
}
