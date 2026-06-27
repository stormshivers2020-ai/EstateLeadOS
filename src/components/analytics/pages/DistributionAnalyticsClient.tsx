"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";

export function DistributionAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const d = data.distributionMetrics;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <Card className="border-slate-700/50 bg-black/20">
        <CardContent className="py-3 text-xs text-slate-400">
          Only approved and sent packets are measured. EstateLeadOS does not auto-send buyer emails.
        </CardContent>
      </Card>

      <SectionHeader title="Buyer / Realtor Distribution" subtitle="Approved sends and response analytics" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Distribution Packets" value={String(d.packetsCreated)} explanation="Buyer/investor packets built" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Approved to Send" value={String(d.approved)} explanation="Manual approval complete" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Emails Sent" value={String(d.emailsSent)} explanation="Including simulated local sends" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Interested Responses" value={String(d.interested)} explanation="Buyer interest tracked" moneyLabel="system_calculated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Packets Sent Over Time" explanation="Monthly send volume" data={d.overTime} />
        <AnalyticsBarChart title="Responses by Recipient Type" explanation="Cash buyer, investor, realtor, etc." data={d.byRecipientType} horizontal />
        <AnalyticsPieChart title="Response Status" explanation="Interested, declined, no response" data={d.responseStatus} />
        <AnalyticsBarChart title="Buyer Interest by County" explanation="Geographic response concentration" data={data.countyRows.map((r) => ({ label: r.county, value: r.verifiedLeads }))} horizontal />
      </div>

      <AnalyticsTable
        title="Recipient Performance"
        explanation="Operational response tracking"
        rows={d.byRecipientType.map((r) => ({ type: r.label, count: r.value }))}
        columns={[
          { key: "type", header: "Recipient Type" },
          { key: "count", header: "Activity Count" },
        ]}
      />
    </div>
  );
}
