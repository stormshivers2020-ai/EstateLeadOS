"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SourceAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const s = data.sourceMetrics;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <SectionHeader title="Source Performance" subtitle="Official proof sources separated from enrichment and rejected" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Official Sources" value={String(s.official)} explanation="Government-record hits" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Enrichment" value={String(s.enrichment)} explanation="Not counted as proof" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Rejected / Failed" value={String(s.rejected)} explanation="Blocked connector runs" moneyLabel="system_calculated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsBarChart title="Leads by Source" explanation="Origin type distribution" data={s.byOrigin} horizontal />
        <AnalyticsPieChart title="Source Trust Distribution" explanation="Official vs enrichment vs rejected" data={s.trustDistribution} />
        <AnalyticsLineChart title="Source Errors Over Time" explanation="Failed connector runs by month" data={s.errorsOverTime} valueLabel="Errors" />
      </div>

      <AnalyticsTable
        title="Source Reliability"
        explanation="Operational source metrics — not legal quality rankings"
        rows={s.byOrigin.map((o) => ({ source: o.label, leads: o.value, trust: o.label.includes("government") ? "official" : "enrichment" }))}
        columns={[
          { key: "source", header: "Source" },
          { key: "leads", header: "Leads Created" },
          { key: "trust", header: "Trust Level" },
        ]}
      />
    </div>
  );
}
