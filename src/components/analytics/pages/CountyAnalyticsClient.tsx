"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function CountyAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const rec = data.countyRecommendations;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <SectionHeader title="County Performance" subtitle="Expand where ROI and confidence are strongest" />

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsBarChart title="Verified Leads by County" explanation="Manual verification count" data={data.countyRows.map((r) => ({ label: `${r.county}`, value: r.verifiedLeads }))} horizontal />
        <AnalyticsBarChart title="Accrued Money by County" explanation="Unpaid accrued totals" data={data.countyRows.map((r) => ({ label: r.county, value: r.accruedMoney }))} formatAsCurrency horizontal moneyLabel="accrued" />
        <AnalyticsBarChart title="Net P/L by County" explanation="Received minus expenses" data={data.countyRows.map((r) => ({ label: r.county, value: r.netProfitLoss }))} formatAsCurrency horizontal moneyLabel="system_calculated" />
        <AnalyticsLineChart title="County Pipeline Trend" explanation="Monthly pipeline value proxy" data={data.monthly.pipeline} moneyLabel="estimated" />
        <AnalyticsPieChart title="County Outcome Mix" explanation="Signals vs verified by county" data={data.countyRows.map((r) => ({ label: r.county, value: r.signals }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecommendationPanel title="Best counties to keep running" items={rec.bestCounties} />
        <RecommendationPanel title="Counties needing source review" items={rec.needsReview} />
        <RecommendationPanel title="High-confidence counties" items={rec.highConfidence} />
        <RecommendationPanel title="Too many bad matches" items={rec.badMatches} />
        <RecommendationPanel title="Strong ROI counties" items={rec.strongRoi} />
        <RecommendationPanel title="Weak ROI counties" items={rec.weakRoi} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.countyRows.slice(0, 4).map((r) => (
          <AnalyticsMetricCard
            key={`${r.state}-${r.county}`}
            title={`${r.county}, ${r.state}`}
            value={formatCurrency(r.netProfitLoss)}
            explanation={`${r.verifiedLeads} verified · ${formatCurrency(r.accruedMoney)} accrued`}
            moneyLabel="system_calculated"
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="premium-panel">
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">No recommendations yet</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-300">
            {items.map((i) => <li key={i}>• {i}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
