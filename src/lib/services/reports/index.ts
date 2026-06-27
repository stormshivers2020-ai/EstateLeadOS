import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { FINANCIAL_REPORT_DISCLAIMER } from "@/lib/constants/compliance-copy";
import { FINANCIAL_ESTIMATE_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import { getOrganizationUsageSummary } from "@/lib/services/usage";
import { getSessionContext } from "@/lib/config/session";
import { getSupportTickets, getPlatformAuditLogs } from "@/lib/services/admin";
import { getCalculatorOverview, getDealCalculations } from "@/lib/services/deal-calculator";
import { getBuyerNetworkOverview, getBuyers } from "@/lib/services/buyers";
import { getAssignmentOverview, getAssignments } from "@/lib/services/assignments";
import { getDocumentBlockers } from "@/lib/services/documents";
import { getActiveBlockers } from "@/lib/services/compliance";
import { getFullLeadsSync } from "@/lib/services/crm";

export function getPhase6Reports() {
  const isDemo = shouldLoadSeedData();
  const calcOverview = getCalculatorOverview();
  const buyerOverview = getBuyerNetworkOverview();
  const assignmentOverview = getAssignmentOverview();
  const leads = getFullLeadsSync();
  const assignments = getAssignments();
  const buyers = getBuyers();

  const underContract = leads.filter((l) =>
    ["under_contract", "buyer_matching", "assignment_sent", "closing_scheduled"].includes(l.pipelineStage)
  ).length;

  const closedWon = leads.filter((l) => l.pipelineStage === "closed_won").length;
  const closedLost = leads.filter((l) => l.pipelineStage === "closed_lost").length;

  const stageDistribution = assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.assignmentStage] = (acc[a.assignmentStage] ?? 0) + 1;
    return acc;
  }, {});

  const topStates = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.state] = (acc[l.state] ?? 0) + 1;
    return acc;
  }, {});

  const pofCoverage = buyers.length
    ? Math.round((buyers.filter((b) => b.proofOfFundsStatus === "on_file").length / buyers.length) * 100)
    : 0;

  const session = getSessionContext();
  const usage = getOrganizationUsageSummary(session.organizationId);
  const tickets = getSupportTickets().filter((t) => t.organizationId === session.organizationId);
  const auditCount = getPlatformAuditLogs().filter((a) => a.organizationId === session.organizationId).length;

  const leadBySource = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.origin ?? "unknown";
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});

  return {
    isDemo,
    disclaimer: FINANCIAL_ESTIMATE_DISCLAIMER,
    financialReportDisclaimer: FINANCIAL_REPORT_DISCLAIMER,
    metrics: [
      { id: "pipeline_value", label: "Estimated Pipeline Value", value: isDemo ? "$348,000" : "—", note: "User-entered estimates" },
      { id: "est_spread", label: "Estimated Assignment Spread", value: isDemo ? `$${assignmentOverview.estimatedPipelineSpread.toLocaleString()}` : "—", note: "Projected range — not guaranteed" },
      { id: "actual_fees", label: "Actual Closed Assignment Fees", value: isDemo ? `$${assignmentOverview.actualFeesRecorded.toLocaleString()}` : "—", note: "Recorded outcomes only" },
      { id: "avg_spread", label: "Average Estimated Spread", value: isDemo ? `$${calcOverview.avgEstimatedSpread.toLocaleString()}` : "—", note: "Based on calculations" },
      { id: "buyer_conversion", label: "Buyer Conversion Rate", value: isDemo ? "24%" : "—", note: "Placeholder metric" },
      { id: "lead_contract", label: "Lead-to-Contract Rate", value: isDemo ? `${Math.round((underContract / Math.max(leads.length, 1)) * 100)}%` : "—", note: "Pipeline stages" },
      { id: "contract_close", label: "Contract-to-Close Rate", value: isDemo ? "12%" : "—", note: "Placeholder metric" },
      { id: "buyer_activity", label: "Buyer Activity (30d)", value: isDemo ? String(buyers.filter((b) => b.lastContacted).length) : "0", note: "Contacts logged" },
      { id: "pof_coverage", label: "Proof of Funds Coverage", value: isDemo ? `${pofCoverage}%` : "—", note: "Buyers with POF on file" },
      { id: "calc_usage", label: "Deal Calculator Usage", value: isDemo ? String(calcOverview.totalCalculations) : "0", note: "Calculations saved" },
      { id: "compliance_blockers", label: "Compliance Blockers", value: isDemo ? String(getActiveBlockers().length) : "0", note: "Active blockers" },
      { id: "doc_blockers", label: "Document Blockers", value: isDemo ? String(getDocumentBlockers().length) : "0", note: "Document workflow" },
      { id: "closed_won", label: "Closed Won", value: String(closedWon), note: "Recorded outcomes" },
      { id: "closed_lost", label: "Closed Lost", value: String(closedLost), note: "Recorded outcomes" },
    ],
    stageDistribution,
    topStates: Object.entries(topStates).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count),
    leadsByCounty: leads.reduce<Record<string, number>>((acc, l) => {
      const key = `${l.county}, ${l.state}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    leadsBySource: Object.entries(leadBySource).map(([source, count]) => ({ source, count })),
    pipelineStages: leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.pipelineStage] = (acc[l.pipelineStage] ?? 0) + 1;
      return acc;
    }, {}),
    usageSummary: usage,
    supportTicketCount: tickets.length,
    auditEventCount: auditCount,
    calculations: getDealCalculations(),
    assignmentOverview,
    buyerOverview,
    reportFilters: [
      "Date range", "State", "County", "Organization", "User", "Lead type",
      "Lead score", "Compliance risk", "Pipeline stage", "Document status",
      "Buyer", "Assignment stage", "Source", "Demo vs real", "Plan", "Market license",
    ],
  };
}
