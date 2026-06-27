"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { StageConversionBar } from "@/components/analytics/charts/StageConversionBar";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsTable } from "@/components/analytics/charts/AnalyticsTable";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PipelineAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const p = data.pipeline;
  const stageData = Object.entries(p.stageCounts).map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <SectionHeader title="Pipeline Metrics" subtitle="Government-record-first conversion funnel" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Gov. Signals" value={String(p.governmentSignals)} explanation="Pipeline items / leads" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Estate Signals" value={String(p.estateSignals)} explanation="Estate / inherited matches" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Verified Leads" value={String(p.verifiedLeads)} explanation="Manually verified" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Packets Built" value={String(p.packetsBuilt)} explanation="Internal packets created" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Attorney Reviews" value={String(p.attorneyReviewsCompleted)} explanation="Completed reviews" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Emails Sent" value={String(p.emailsSent)} explanation="Approved sends only" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Fees Recorded" value={String(p.feeRecorded)} explanation="Assignment fees recorded" moneyLabel="user_entered" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StageConversionBar title="Master Process Funnel" explanation="Lead conversion by process step" data={data.funnelSteps} />
        <AnalyticsPieChart title="Lead Outcome Status" explanation="Active vs closed outcomes" data={data.outcomeDistribution} />
        <AnalyticsBarChart title="Pipeline by County" explanation="Verified lead concentration" data={data.countyRows.map((r) => ({ label: r.county, value: r.verifiedLeads }))} horizontal />
        <AnalyticsBarChart title="Bottleneck Stages" explanation="Where leads get stuck" data={data.bottlenecks.map((b) => ({ label: b.stage, value: b.count }))} horizontal />
      </div>

      <ProcessStepMap aggregateCounts={data.stepCounts} currentStep={data.nextStep.step} />

      <AnalyticsTable
        title="Bottleneck Detail"
        explanation="Stage, count, and reason"
        rows={data.bottlenecks}
        columns={[
          { key: "stage", header: "Stage" },
          { key: "count", header: "Count" },
          { key: "reason", header: "Reason" },
        ]}
      />

      {stageData.length > 0 && (
        <AnalyticsBarChart title="CRM Pipeline Stages" explanation="Lead count by CRM stage" data={stageData} horizontal />
      )}
    </div>
  );
}
