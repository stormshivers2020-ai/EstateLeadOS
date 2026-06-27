"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";

export function AttorneyAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const a = data.attorneyMetrics;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <Card className="border-slate-700/50 bg-black/20">
        <CardContent className="py-3 text-xs text-slate-400">
          Operational attorney review metrics only — not legal-quality rankings or advice.
        </CardContent>
      </Card>

      <SectionHeader title="Attorney Review Analytics" subtitle="Throughput, outcomes, and cost tracking" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Sent for Review" value={String(a.sent)} explanation="Non-draft reviews" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Approved" value={String(a.approved)} explanation="Approved or approved with notes" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Rejected" value={String(a.rejected)} explanation="Rejected packets" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Attorney Fees (Est.)" value={formatCurrency(a.totalFees)} explanation="Proposed/planned fees" moneyLabel="estimated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Attorney Reviews Over Time" explanation="Monthly review volume" data={a.overTime} />
        <AnalyticsPieChart title="Review Outcomes" explanation="Status distribution" data={a.outcomes} />
        <AnalyticsBarChart title="Attorney Costs by Lead" explanation="Proposed flat fees" data={a.costByLead} formatAsCurrency horizontal moneyLabel="estimated" />
      </div>
    </div>
  );
}
