"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import { ACCRUED_MONEY_WARNING } from "@/lib/types/analytics";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

export function AccruedMoneyClient({ data }: { data: CommandCenterAnalytics }) {
  const accrued = data.accrued;
  const byStatus = accrued.reduce<Record<string, number>>((acc, a) => {
    acc[a.payoutStatus] = (acc[a.payoutStatus] ?? 0) + a.accruedAmount;
    return acc;
  }, {});

  const byMonth = data.monthly.accrued;
  const byCounty = data.countyRows.map((r) => ({ label: `${r.county}, ${r.state}`, value: r.accruedMoney }));

  const receivedCount = accrued.filter((a) => a.payoutStatus === "received").length;
  const conversionRate = accrued.length ? (receivedCount / accrued.length) * 100 : 0;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <Card className="border-amber-800/30 bg-amber-950/10">
        <CardContent className="flex gap-2 py-3 text-sm text-amber-200/90">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {ACCRUED_MONEY_WARNING}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Total Accrued" value={formatCurrency(data.snapshot.totalAccruedMoney)} explanation="Unpaid accrued amounts" moneyLabel="accrued" />
        <AnalyticsMetricCard title="Pending Payout" value={formatCurrency(data.snapshot.totalPendingPayout)} explanation="Awaiting payout confirmation" moneyLabel="pending" />
        <AnalyticsMetricCard title="Received Conversion" value={`${conversionRate.toFixed(0)}%`} explanation="Accrued records marked received" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Disputed / Blocked" value={String(accrued.filter((a) => a.payoutStatus.includes("disputed")).length)} explanation="Requires manual review" moneyLabel="accrued" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Accrued by Month" explanation="Accrual dates" data={byMonth} moneyLabel="accrued" />
        <AnalyticsPieChart title="Accrued by Status" explanation="Payout readiness status" data={Object.entries(byStatus).map(([label, value]) => ({ label, value }))} moneyLabel="accrued" />
        <AnalyticsBarChart title="Accrued by County" explanation="Geographic accrual concentration" data={byCounty} formatAsCurrency horizontal moneyLabel="accrued" />
        <AnalyticsBarChart title="Aging Accrued" explanation="Days past expected payout" data={data.assignmentMetrics.agingAccrued.map((a) => ({ label: a.label, value: Math.max(0, a.secondary ?? 0) }))} horizontal />
      </div>

      <AnalyticsTable
        title="Accrued Money by Deal"
        explanation="Deal-level accrual records — not received until manually confirmed"
        rows={accrued}
        columns={[
          { key: "leadId", header: "Lead" },
          { key: "accruedAmount", header: "Accrued", render: (r) => formatCurrency(r.accruedAmount as number) },
          { key: "payoutStatus", header: "Status" },
          { key: "buyerName", header: "Buyer" },
          { key: "titleCompany", header: "Title Co." },
          { key: "expectedPayoutDate", header: "Expected Payout" },
          { key: "closingStatus", header: "Closing" },
        ]}
      />
    </div>
  );
}
