"use client";

import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsBarChart } from "@/components/analytics/charts/AnalyticsBarChart";
import { AnalyticsPieChart } from "@/components/analytics/charts/AnalyticsPieChart";
import { AnalyticsLineChart } from "@/components/analytics/charts/AnalyticsLineChart";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PacketAnalyticsClient({ data }: { data: CommandCenterAnalytics }) {
  const p = data.packetMetrics;

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <SectionHeader title="Packet & Archive Analytics" subtitle="Print, archive, attorney, and buyer readiness" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard title="Packets Created" value={String(p.created)} explanation="All packet types" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Printed" value={String(p.printed)} explanation="Print log entries" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Archived" value={String(p.archived)} explanation="Lead archive records" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Ready to Print" value={String(p.readyToPrint)} explanation="Internal review ready" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Attorney Ready" value={String(p.attorneyReady)} explanation="Assignment review ready packets" moneyLabel="system_calculated" />
        <AnalyticsMetricCard title="Buyer Ready" value={String(p.buyerReady)} explanation="Ready for buyer distribution" moneyLabel="system_calculated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsLineChart title="Packets Created Over Time" explanation="Monthly packet generation" data={p.overTime} />
        <AnalyticsBarChart title="Packets by Status" explanation="Current packet status distribution" data={p.byStatus} horizontal />
        <AnalyticsPieChart title="Packet Type Distribution" explanation="Internal, buyer, attorney, archive types" data={p.byType} />
      </div>

      <ProcessStepMap aggregateCounts={data.stepCounts} currentStep={13} compact />
    </div>
  );
}
