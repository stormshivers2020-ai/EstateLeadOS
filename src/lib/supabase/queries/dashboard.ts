import "server-only";

import { cache } from "react";
import { FRESH_START_DASHBOARD_METRICS } from "@/lib/seed/demo-dashboard";
import type { DashboardMetrics } from "@/lib/types";
import { fetchLeadsForOrg } from "./leads";

export const fetchDashboardMetrics = cache(async (): Promise<DashboardMetrics> => {
  const leads = await fetchLeadsForOrg();
  if (leads.length === 0) return FRESH_START_DASHBOARD_METRICS;

  const highScore = leads.filter((l) => l.estateLeadScore >= 75).length;
  const needsCompliance = leads.filter((l) => l.complianceRiskScore >= 60).length;
  const underContract = leads.filter((l) => l.pipelineStage === "under_contract").length;
  const byState = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.state) acc[l.state] = (acc[l.state] ?? 0) + 1;
    return acc;
  }, {});

  return {
    ...FRESH_START_DASHBOARD_METRICS,
    totalEstateLeads: leads.length,
    newLeadsThisWeek: leads.length,
    highScoreLeads: highScore,
    leadsByState: Object.entries(byState).map(([state, count]) => ({ state, count })),
    leadsNeedingComplianceReview: needsCompliance,
    leadsUnderContract: underContract,
    leadsReadyForOutreach: leads.filter((l) => l.pipelineStage === "contact_ready").length,
  };
});
