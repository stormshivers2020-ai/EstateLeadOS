import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadsSync } from "@/lib/services/crm";
import { getDealCalculations, getCalculatorOverview } from "@/lib/services/deal-calculator";
import { getAssignments, getAssignmentOverview } from "@/lib/services/assignments";
import { getBuyers } from "@/lib/services/buyers";
import { getLocalState } from "@/lib/local/localStateStore";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { MASTER_PROCESS_STEPS, COMMAND_CENTER_START_STEPS } from "@/lib/constants/process-steps";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types/analytics";
import type {
  AccruedMoneyRecord,
  ChartSeriesPoint,
  CountyPerformanceRow,
  DealFinancials,
  ExpenseRecord,
  FinancialSnapshot,
  PipelineAnalytics,
  ProcessStepStatusRecord,
} from "@/lib/types/analytics";
import {
  buildLeadProcessSteps,
  aggregateStepCounts,
  inferLeadCurrentStep,
  isVerifiedLead,
  type LeadProcessContext,
} from "./process-step";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function getFinancialData() {
  const state = getLocalState();
  return {
    dealFinancials: state.dealFinancials ?? [],
    expenseRecords: state.expenseRecords ?? [],
    accruedMoneyRecords: state.accruedMoneyRecords ?? [],
    programPackets: state.programPackets ?? [],
    leadArchives: state.leadArchives ?? [],
    attorneyReviews: state.attorneyReviews ?? [],
    attorneyCompensation: state.attorneyCompensation ?? [],
    distributionPackets: state.distributionPackets ?? [],
    emailDistributions: state.emailDistributions ?? [],
    externalRecipients: state.externalRecipients ?? [],
    leadPipelineItems: state.leadPipelineItems ?? [],
    countyPipelineConfigs: state.countyPipelineConfigs ?? [],
    assignmentReadiness: state.assignmentReadiness ?? [],
    reviewQueueItems: state.reviewQueueItems ?? [],
    packetPrintLogs: state.packetPrintLogs ?? [],
    connectorLogs: state.connectorLogs ?? [],
  };
}

function buildFinancialSnapshot(
  dealFinancials: DealFinancials[],
  expenses: ExpenseRecord[],
  accrued: AccruedMoneyRecord[],
  assignmentOverview: ReturnType<typeof getAssignmentOverview>,
  calcOverview: ReturnType<typeof getCalculatorOverview>,
  verifiedLeadCount: number,
): FinancialSnapshot {
  const estimatedPipeline = sum(
    dealFinancials.filter((d) => !["received", "lost", "written_off"].includes(d.financialStatus))
      .map((d) => d.targetAssignmentFee ?? d.estimatedSpread ?? 0)
  ) || assignmentOverview.estimatedPipelineSpread;

  const targetFees = sum(dealFinancials.map((d) => d.targetAssignmentFee ?? 0));
  const accruedTotal = sum(
    accrued.filter((a) => a.payoutStatus !== "received" && a.payoutStatus !== "rejected" && a.accruedAmount > 0)
      .map((a) => a.accruedAmount)
  );
  const pendingPayout = sum(
    dealFinancials.map((d) => d.pendingPayoutAmount ?? 0)
  ) || accruedTotal;
  const received = sum(dealFinancials.map((d) => d.receivedAmount ?? 0));
  const paidExpenses = sum(
    expenses.filter((e) => e.paymentStatus === "paid" || e.paymentStatus === "reimbursed").map((e) => e.amount)
  );
  const netProfitLoss = received - paidExpenses;
  const projectedExpenses = sum(expenses.map((e) => e.amount));
  const projectedProfit = sum(dealFinancials.map((d) => d.projectedNetProfit ?? 0))
    || (estimatedPipeline - projectedExpenses);

  const closedDeals = dealFinancials.filter((d) => d.receivedAmount && d.receivedAmount > 0).length;
  const lostDeals = dealFinancials.filter((d) => d.financialStatus === "lost").length;
  const totalOutcomes = closedDeals + lostDeals || 1;

  return {
    estimatedPipelineValue: estimatedPipeline,
    totalTargetAssignmentFees: targetFees,
    totalAccruedMoney: accruedTotal,
    totalPendingPayout: pendingPayout,
    totalReceivedMoney: received,
    totalExpenses: paidExpenses,
    netProfitLoss,
    projectedProfitLoss: projectedProfit,
    averageAssignmentFee: calcOverview.avgEstimatedSpread || (targetFees / Math.max(dealFinancials.length, 1)),
    costPerVerifiedLead: verifiedLeadCount ? paidExpenses / verifiedLeadCount : 0,
    costPerClosedDeal: closedDeals ? paidExpenses / closedDeals : 0,
    winRate: (closedDeals / totalOutcomes) * 100,
    lossRate: (lostDeals / totalOutcomes) * 100,
  };
}

function buildMonthlySeries(
  dealFinancials: DealFinancials[],
  expenses: ExpenseRecord[],
  accrued: AccruedMoneyRecord[],
): {
  pipeline: ChartSeriesPoint[];
  accrued: ChartSeriesPoint[];
  received: ChartSeriesPoint[];
  expense: ChartSeriesPoint[];
} {
  const months = lastMonths(6);
  const pipeline: ChartSeriesPoint[] = months.map((m) => ({ label: m, value: 0 }));
  const accruedSeries: ChartSeriesPoint[] = months.map((m) => ({ label: m, value: 0 }));
  const receivedSeries: ChartSeriesPoint[] = months.map((m) => ({ label: m, value: 0 }));
  const expenseSeries: ChartSeriesPoint[] = months.map((m) => ({ label: m, value: 0 }));

  for (const d of dealFinancials) {
    const mk = monthKey(new Date(d.updatedAt));
    const pi = pipeline.findIndex((p) => p.label === mk);
    if (pi >= 0) pipeline[pi].value += d.targetAssignmentFee ?? d.estimatedSpread ?? 0;
    if (d.receivedAmount) {
      const ri = receivedSeries.findIndex((p) => p.label === mk);
      if (ri >= 0) receivedSeries[ri].value += d.receivedAmount;
    }
  }
  for (const a of accrued) {
    if (!a.accruedDate || a.accruedAmount <= 0) continue;
    const mk = monthKey(new Date(a.accruedDate));
    const ai = accruedSeries.findIndex((p) => p.label === mk);
    if (ai >= 0) accruedSeries[ai].value += a.accruedAmount;
  }
  for (const e of expenses) {
    const mk = monthKey(new Date(e.expenseDate));
    const ei = expenseSeries.findIndex((p) => p.label === mk);
    if (ei >= 0) expenseSeries[ei].value += e.amount;
  }

  return { pipeline, accrued: accruedSeries, received: receivedSeries, expense: expenseSeries };
}

function buildCountyPerformance(
  leads: ReturnType<typeof getFullLeadsSync>,
  dealFinancials: DealFinancials[],
  expenses: ExpenseRecord[],
  accrued: AccruedMoneyRecord[],
): CountyPerformanceRow[] {
  const map = new Map<string, CountyPerformanceRow>();

  for (const lead of leads) {
    const key = `${lead.state}|${lead.county}`;
    const row = map.get(key) ?? {
      county: lead.county,
      state: lead.state,
      signals: 0,
      verifiedLeads: 0,
      accruedMoney: 0,
      receivedMoney: 0,
      expenses: 0,
      netProfitLoss: 0,
    };
    row.signals += 1;
    if (isVerifiedLead(lead)) row.verifiedLeads += 1;
    map.set(key, row);
  }

  for (const df of dealFinancials) {
    const lead = leads.find((l) => l.id === df.leadId);
    if (!lead) continue;
    const key = `${lead.state}|${lead.county}`;
    const row = map.get(key);
    if (row) {
      row.receivedMoney += df.receivedAmount ?? 0;
      row.accruedMoney += df.accruedAmount ?? 0;
    }
  }
  for (const a of accrued) {
    const lead = leads.find((l) => l.id === a.leadId);
    if (!lead) continue;
    const key = `${lead.state}|${lead.county}`;
    const row = map.get(key);
    if (row && a.payoutStatus !== "received") row.accruedMoney += a.accruedAmount;
  }
  for (const e of expenses) {
    if (!e.leadId) continue;
    const lead = leads.find((l) => l.id === e.leadId);
    if (!lead) continue;
    const key = `${lead.state}|${lead.county}`;
    const row = map.get(key);
    if (row) row.expenses += e.amount;
  }
  for (const row of map.values()) {
    row.netProfitLoss = row.receivedMoney - row.expenses;
  }
  return Array.from(map.values()).sort((a, b) => b.verifiedLeads - a.verifiedLeads);
}

export function getCommandCenterAnalytics() {
  const isDemo = shouldLoadSeedData();
  const session = getSessionContext();
  const leads = getFullLeadsSync();
  const assignments = getAssignments();
  const calcOverview = getCalculatorOverview();
  const assignmentOverview = getAssignmentOverview();
  const fin = getFinancialData();

  const verifiedCount = leads.filter(isVerifiedLead).length;
  const snapshot = buildFinancialSnapshot(
    fin.dealFinancials,
    fin.expenseRecords,
    fin.accruedMoneyRecords,
    assignmentOverview,
    calcOverview,
    verifiedCount,
  );

  const allStepRecords: ProcessStepStatusRecord[] = [];
  for (const lead of leads) {
    const ctx: LeadProcessContext = {
      lead,
      assignment: assignments.find((a) => a.leadId === lead.id),
      packets: fin.programPackets.filter((p) => p.leadId === lead.id),
      attorneyReview: fin.attorneyReviews.find((r) => r.leadId === lead.id),
      distributionPacket: fin.distributionPackets.find((p) => p.leadId === lead.id),
      emailDistribution: fin.emailDistributions.find((e) => e.leadId === lead.id),
    };
    allStepRecords.push(...buildLeadProcessSteps(ctx, session.organizationId));
  }

  const stepCounts = aggregateStepCounts(allStepRecords);
  const monthly = buildMonthlySeries(fin.dealFinancials, fin.expenseRecords, fin.accruedMoneyRecords);
  const countyRows = buildCountyPerformance(leads, fin.dealFinancials, fin.expenseRecords, fin.accruedMoneyRecords);

  const expenseByCategory = Object.entries(
    fin.expenseRecords.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).map(([k, v]) => ({
    label: EXPENSE_CATEGORY_LABELS[k as keyof typeof EXPENSE_CATEGORY_LABELS] ?? k,
    value: v,
  }));

  const outcomeDistribution: ChartSeriesPoint[] = [
    { label: "Active Pipeline", value: leads.filter((l) => !["closed_won", "closed_lost", "dead_lead", "do_not_contact"].includes(l.pipelineStage)).length },
    { label: "Closed Won", value: leads.filter((l) => l.pipelineStage === "closed_won").length },
    { label: "Closed Lost", value: leads.filter((l) => l.pipelineStage === "closed_lost").length },
    { label: "Rejected / DNC", value: leads.filter((l) => ["dead_lead", "do_not_contact"].includes(l.pipelineStage)).length },
  ];

  const funnelSteps = MASTER_PROCESS_STEPS.slice(0, 12).map((s) => ({
    label: `Step ${s.number}`,
    value: stepCounts[s.number] ?? (s.number <= 3 ? leads.length : Math.max(0, leads.length - s.number)),
    secondary: s.number,
  }));

  const bottlenecks = [
    { stage: "Attorney Review Pending", count: fin.attorneyReviews.filter((r) => r.reviewStatus === "under_attorney_review" || r.reviewStatus === "sent_delivered_manually").length, reason: "Attorney review not completed" },
    { stage: "Buyer Packet Not Approved", count: fin.distributionPackets.filter((p) => p.userApprovalStatus === "pending").length, reason: "Manual approval required" },
    { stage: "Missing Property Visual", count: leads.filter((l) => !l.propertyAddress).length, reason: "Property match incomplete" },
    { stage: "Compliance Blockers", count: leads.filter((l) => l.complianceRiskScore > 65).length, reason: "Elevated compliance risk" },
    { stage: "Payout Readiness Incomplete", count: fin.accruedMoneyRecords.filter((a) => a.payoutStatus.includes("pending")).length, reason: "Accrued but unpaid" },
  ].filter((b) => b.count > 0);

  const orgWideCurrentStep = leads.length === 0 ? 1 : Math.min(...leads.map((l) => {
    const ctx: LeadProcessContext = { lead: l, assignment: assignments.find((a) => a.leadId === l.id) };
    return inferLeadCurrentStep(ctx);
  }));

  const nextStep = COMMAND_CENTER_START_STEPS.find((s) => s.step >= orgWideCurrentStep) ?? COMMAND_CENTER_START_STEPS[0];

  return {
    isDemo,
    isLocal: isLocalPreviewMode(),
    snapshot,
    monthly,
    countyRows,
    expenseByCategory,
    outcomeDistribution,
    funnelSteps,
    bottlenecks,
    stepCounts,
    masterSteps: MASTER_PROCESS_STEPS,
    startHereStep: 1,
    nextStep,
    commandCenterSteps: COMMAND_CENTER_START_STEPS,
    pipeline: buildPipelineAnalytics(leads, fin),
    sourceMetrics: buildSourceMetrics(leads, fin),
    packetMetrics: buildPacketMetrics(fin),
    attorneyMetrics: buildAttorneyMetrics(fin),
    distributionMetrics: buildDistributionMetrics(fin),
    assignmentMetrics: buildAssignmentMetrics(assignments, fin),
    dealFinancials: fin.dealFinancials,
    expenses: fin.expenseRecords,
    accrued: fin.accruedMoneyRecords,
    dealLevelPnL: buildDealLevelPnL(leads, fin.dealFinancials, fin.expenseRecords),
    countyRecommendations: buildCountyRecommendations(countyRows),
  };
}

function buildPipelineAnalytics(
  leads: ReturnType<typeof getFullLeadsSync>,
  fin: ReturnType<typeof getFinancialData>,
): PipelineAnalytics {
  return {
    governmentSignals: fin.leadPipelineItems.length || leads.length,
    estateSignals: leads.filter((l) => l.primaryLeadType?.includes("estate") || l.primaryLeadType?.includes("inherited")).length,
    verifiedLeads: leads.filter(isVerifiedLead).length,
    packetsBuilt: fin.programPackets.length,
    attorneyReviewsCompleted: fin.attorneyReviews.filter((r) => r.reviewStatus === "approved" || r.reviewStatus === "approved_with_notes").length,
    emailsSent: fin.emailDistributions.filter((e) => e.sendStatus === "sent" || e.sendStatus === "simulated").length,
    feeRecorded: fin.dealFinancials.filter((d) => d.agreedAssignmentFee).length,
    stageCounts: leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.pipelineStage] = (acc[l.pipelineStage] ?? 0) + 1;
      return acc;
    }, {}),
    bottlenecks: [],
  };
}

function buildSourceMetrics(
  leads: ReturnType<typeof getFullLeadsSync>,
  fin: ReturnType<typeof getFinancialData>,
) {
  const byOrigin = leads.reduce<Record<string, number>>((acc, l) => {
    const o = l.origin ?? "unknown";
    acc[o] = (acc[o] ?? 0) + 1;
    return acc;
  }, {});
  const official = leads.filter((l) => l.origin === "government_record" || l.origin === "county_pipeline").length;
  const enrichment = leads.filter((l) => l.origin === "enrichment" || l.origin === "internet_search").length;
  const rejected = fin.connectorLogs.filter((l) => l.status === "blocked" || l.status === "failed").length;

  return {
    byOrigin: Object.entries(byOrigin).map(([label, value]) => ({ label, value })),
    official,
    enrichment,
    rejected,
    errorsOverTime: lastMonths(6).map((m) => ({
      label: m,
      value: fin.connectorLogs.filter((l) => monthKey(new Date(l.createdAt)) === m && l.status === "failed").length,
    })),
    trustDistribution: [
      { label: "Official", value: official },
      { label: "Official Secondary", value: Math.floor(official * 0.3) },
      { label: "Enrichment", value: enrichment },
      { label: "Rejected", value: rejected },
    ],
  };
}

function buildPacketMetrics(fin: ReturnType<typeof getFinancialData>) {
  const byStatus = fin.programPackets.reduce<Record<string, number>>((acc, p) => {
    acc[p.packetStatus] = (acc[p.packetStatus] ?? 0) + 1;
    return acc;
  }, {});
  const byType = fin.programPackets.reduce<Record<string, number>>((acc, p) => {
    acc[p.packetType] = (acc[p.packetType] ?? 0) + 1;
    return acc;
  }, {});

  return {
    created: fin.programPackets.length,
    printed: fin.packetPrintLogs.length,
    archived: fin.leadArchives.length,
    readyToPrint: fin.programPackets.filter((p) => p.packetStatus === "ready_for_internal_review").length,
    attorneyReady: fin.programPackets.filter((p) => p.packetStatus === "assignment_review_ready").length,
    buyerReady: fin.programPackets.filter((p) => p.packetStatus === "ready_for_buyer_review").length,
    byStatus: Object.entries(byStatus).map(([label, value]) => ({ label, value })),
    byType: Object.entries(byType).map(([label, value]) => ({ label, value })),
    overTime: lastMonths(6).map((m) => ({
      label: m,
      value: fin.programPackets.filter((p) => monthKey(new Date(p.createdAt)) === m).length,
    })),
  };
}

function buildAttorneyMetrics(fin: ReturnType<typeof getFinancialData>) {
  const reviews = fin.attorneyReviews;
  const outcomes = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.reviewStatus] = (acc[r.reviewStatus] ?? 0) + 1;
    return acc;
  }, {});
  const fees = fin.attorneyCompensation.reduce((s, c) => s + (c.proposedFlatFee ?? 0), 0);

  return {
    sent: reviews.filter((r) => r.reviewStatus !== "not_started").length,
    approved: reviews.filter((r) => r.reviewStatus === "approved" || r.reviewStatus === "approved_with_notes").length,
    rejected: reviews.filter((r) => r.reviewStatus === "rejected").length,
    changesRequested: reviews.filter((r) => r.reviewStatus === "changes_requested").length,
    totalFees: fees,
    outcomes: Object.entries(outcomes).map(([label, value]) => ({ label, value })),
    overTime: lastMonths(6).map((m) => ({
      label: m,
      value: reviews.filter((r) => monthKey(new Date(r.createdAt)) === m).length,
    })),
    costByLead: reviews.map((r) => ({
      label: r.leadId.slice(-8),
      value: fin.attorneyCompensation.find((c) => c.leadId === r.leadId)?.proposedFlatFee ?? 0,
    })),
  };
}

function buildDistributionMetrics(fin: ReturnType<typeof getFinancialData>) {
  const emails = fin.emailDistributions;
  const packets = fin.distributionPackets;

  return {
    packetsCreated: packets.length,
    approved: packets.filter((p) => p.userApprovalStatus === "approved" || p.packetStatus === "approved_to_send").length,
    emailsSent: emails.filter((e) => e.sendStatus === "sent" || e.sendStatus === "simulated").length,
    responses: fin.externalRecipients.filter((r) => r.responseStatus === "interested" || r.responseStatus === "declined").length,
    interested: fin.externalRecipients.filter((r) => r.responseStatus === "interested").length,
    declined: fin.externalRecipients.filter((r) => r.responseStatus === "declined").length,
    byRecipientType: [
      { label: "Cash Buyer", value: 2 },
      { label: "Investor", value: 1 },
      { label: "Realtor", value: 1 },
    ],
    responseStatus: [
      { label: "Interested", value: fin.externalRecipients.filter((r) => r.responseStatus === "interested").length },
      { label: "Declined", value: fin.externalRecipients.filter((r) => r.responseStatus === "declined").length },
      { label: "No Response", value: fin.externalRecipients.filter((r) => r.responseStatus === "not_contacted" || r.responseStatus === "packet_sent").length },
    ],
    overTime: lastMonths(6).map((m) => ({
      label: m,
      value: emails.filter((e) => monthKey(new Date(e.createdAt)) === m).length,
    })),
  };
}

function buildAssignmentMetrics(
  assignments: ReturnType<typeof getAssignments>,
  fin: ReturnType<typeof getFinancialData>,
) {
  const byStage = assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.assignmentStage] = (acc[a.assignmentStage] ?? 0) + 1;
    return acc;
  }, {});

  const accruedUnpaid = fin.accruedMoneyRecords.filter(
    (a) => a.accruedAmount > 0 && a.payoutStatus !== "received",
  );

  return {
    total: assignments.length,
    feeRecorded: assignments.filter((a) => a.actualAssignmentFee).length,
    avgTargetFee: sum(fin.dealFinancials.map((d) => d.targetAssignmentFee ?? 0)) / Math.max(fin.dealFinancials.length, 1),
    avgAgreedFee: sum(fin.dealFinancials.map((d) => d.agreedAssignmentFee ?? 0)) / Math.max(fin.dealFinancials.filter((d) => d.agreedAssignmentFee).length, 1),
    byStage: Object.entries(byStage).map(([label, value]) => ({ label, value })),
    payoutStatus: [
      { label: "Not Started", value: fin.accruedMoneyRecords.filter((a) => a.payoutStatus === "not_accrued").length },
      { label: "Pending Closing", value: fin.accruedMoneyRecords.filter((a) => a.payoutStatus.includes("pending")).length },
      { label: "Received", value: fin.accruedMoneyRecords.filter((a) => a.payoutStatus === "received").length },
      { label: "Disputed", value: fin.accruedMoneyRecords.filter((a) => a.payoutStatus === "accrued_disputed").length },
    ],
    accruedVsReceived: lastMonths(6).map((m) => ({
      label: m,
      value: fin.accruedMoneyRecords.filter((a) => a.accruedDate && monthKey(new Date(a.accruedDate)) === m).reduce((s, a) => s + a.accruedAmount, 0),
      secondary: fin.dealFinancials.filter((d) => monthKey(new Date(d.updatedAt)) === m).reduce((s, d) => s + (d.receivedAmount ?? 0), 0),
    })),
    agingAccrued: accruedUnpaid.map((a) => ({
      label: a.leadId.slice(-8),
      value: a.accruedAmount,
      secondary: a.expectedPayoutDate ? Math.floor((Date.now() - new Date(a.expectedPayoutDate).getTime()) / 86400000) : 0,
    })),
  };
}

function buildDealLevelPnL(
  leads: ReturnType<typeof getFullLeadsSync>,
  dealFinancials: DealFinancials[],
  expenses: ExpenseRecord[],
) {
  return dealFinancials.map((df) => {
    const lead = leads.find((l) => l.id === df.leadId);
    const leadExpenses = expenses.filter((e) => e.leadId === df.leadId).reduce((s, e) => s + e.amount, 0);
    return {
      leadId: df.leadId,
      address: lead?.propertyAddress ?? df.leadId,
      county: lead ? `${lead.county}, ${lead.state}` : "—",
      targetFee: df.targetAssignmentFee,
      accrued: df.accruedAmount,
      pending: df.pendingPayoutAmount,
      received: df.receivedAmount,
      expenses: leadExpenses,
      projected: df.projectedNetProfit,
      actual: df.actualNetProfit ?? ((df.receivedAmount ?? 0) - leadExpenses),
      status: df.financialStatus,
    };
  });
}

function buildCountyRecommendations(rows: CountyPerformanceRow[]) {
  const sorted = [...rows].sort((a, b) => b.netProfitLoss - a.netProfitLoss);
  return {
    bestCounties: sorted.filter((r) => r.verifiedLeads >= 1).slice(0, 3).map((r) => `${r.county}, ${r.state}`),
    needsReview: rows.filter((r) => r.signals > 2 && r.verifiedLeads === 0).map((r) => `${r.county}, ${r.state}`),
    highConfidence: rows.filter((r) => r.verifiedLeads >= 2).map((r) => `${r.county}, ${r.state}`),
    badMatches: rows.filter((r) => r.signals > 3 && r.verifiedLeads === 0).map((r) => `${r.county}, ${r.state}`),
    strongRoi: sorted.filter((r) => r.netProfitLoss > 0).map((r) => `${r.county}, ${r.state}`),
    weakRoi: sorted.filter((r) => r.netProfitLoss <= 0 && r.expenses > 0).map((r) => `${r.county}, ${r.state}`),
  };
}

export function getLeadFinancials(leadId: string) {
  const fin = getFinancialData();
  const leads = getFullLeadsSync();
  const assignments = getAssignments();
  const lead = leads.find((l) => l.id === leadId);
  const df = fin.dealFinancials.find((d) => d.leadId === leadId);
  const accrued = fin.accruedMoneyRecords.find((a) => a.leadId === leadId);
  const expenses = fin.expenseRecords.filter((e) => e.leadId === leadId);
  const calcs = getDealCalculations().filter((c) => c.leadId === leadId);
  const latestCalc = calcs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  if (!lead) {
    return {
      dealFinancials: null,
      accrued: undefined,
      expenses: [],
      latestCalc: undefined,
      processSteps: [],
      currentStep: 1,
      expenseBreakdown: {},
    };
  }

  const ctx: LeadProcessContext = {
    lead,
    assignment: assignments.find((a) => a.leadId === leadId),
    packets: fin.programPackets.filter((p) => p.leadId === leadId),
    attorneyReview: fin.attorneyReviews.find((r) => r.leadId === leadId),
    distributionPacket: fin.distributionPackets.find((p) => p.leadId === leadId),
    emailDistribution: fin.emailDistributions.find((e) => e.leadId === leadId),
  };

  const processSteps = lead ? buildLeadProcessSteps(ctx, getSessionContext().organizationId) : [];
  const currentStep = lead ? inferLeadCurrentStep(ctx) : 1;

  return {
    dealFinancials: df ?? null,
    accrued,
    expenses,
    latestCalc,
    processSteps,
    currentStep,
    expenseBreakdown: expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  };
}

export type CommandCenterAnalytics = ReturnType<typeof getCommandCenterAnalytics>;
