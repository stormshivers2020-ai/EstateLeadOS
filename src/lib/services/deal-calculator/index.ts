import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";

const p = () => getDataProvider();
import { runDealCalculation } from "@/lib/deal-calculator/dealCalculatorEngine";
import { calculateDealPotentialScore } from "@/lib/deal-calculator/dealPotentialScoring";
import type { DealCalculatorInput, DealCalculation, DealPotentialScoreRecord } from "@/lib/deal-calculator/dealCalculatorTypes";
import {
  DEMO_DEAL_POTENTIAL,
} from "@/lib/seed/demo-deal-workflow";
import { matchBuyersToLead } from "@/lib/engines/buyer-matching-engine";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadPacket } from "@/lib/services/documents";

export function getDealCalculations(leadId?: string): DealCalculation[] {
  const calcs = shouldLoadSeedData() ? [...p().dealWorkflow.getCalculations()] : [];
  return leadId ? calcs.filter((c) => c.leadId === leadId) : calcs;
}

export function getLatestCalculation(leadId: string): DealCalculation | null {
  const calcs = getDealCalculations(leadId);
  return calcs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

export function getDealPotentialScore(leadId: string): DealPotentialScoreRecord | null {
  const records = shouldLoadSeedData() ? DEMO_DEAL_POTENTIAL : [];
  return records.find((r) => r.leadId === leadId) ?? null;
}

export function runCalculatorForLead(
  leadId: string,
  input: DealCalculatorInput,
  createdBy = "demo-user"
): { calculation: DealCalculation; result: ReturnType<typeof runDealCalculation> } | null {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return null;

  const matches = shouldLoadSeedData()
    ? p().dealWorkflow.getBuyerMatches().filter((m) => m.leadId === leadId)
    : (() => {
        const lead = getFullLeadByIdSync(leadId);
        if (!lead) return [];
        return matchBuyersToLead(p().dealWorkflow.getBuyers(), lead).map((m, i) => ({
          ...m, id: `m-${i}`, organizationId: lead.organizationId,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }));
      })();
  const topMatch = matches[0];
  const packet = getLeadPacket(leadId);

  const result = runDealCalculation(
    input,
    {
      dataConfidenceScore: lead.dataConfidenceScore,
      complianceRiskScore: lead.complianceRiskScore,
      estimatedValue: lead.estimatedValue,
      taxAssessedValue: lead.taxAssessedValue,
      vacancySignal: lead.vacancySignal,
      taxDelinquent: lead.taxDelinquent,
      estateLeadScore: lead.estateLeadScore,
    },
    {
      buyerMatchStrength: topMatch?.matchScore,
      documentReadiness: packet?.readinessScore,
      activeBlockers: packet?.missingDocuments.length,
    }
  );

  const now = new Date().toISOString();
  const calculation: DealCalculation = {
    id: `calc-${Date.now()}`,
    organizationId: lead.organizationId,
    leadId,
    createdBy,
    estimatedArv: input.estimatedArv,
    estimatedCurrentValue: input.estimatedCurrentValue ?? lead.estimatedValue,
    taxAssessedValue: input.taxAssessedValue ?? lead.taxAssessedValue,
    estimatedRepairs: input.estimatedRepairs,
    investorDiscountPercentage: input.investorDiscountPercentage,
    holdingCosts: input.holdingCosts,
    closingCosts: input.closingCosts,
    targetAssignmentSpread: input.targetAssignmentSpread,
    riskBuffer: input.riskBuffer ?? 0,
    buyerType: input.buyerType ?? "Cash investor",
    investorMaxOffer: result.investorMaxOffer,
    suggestedSellerOffer: result.suggestedSellerOffer,
    offerRangeLow: result.offerRangeLow,
    offerRangeHigh: result.offerRangeHigh,
    estimatedSpread: result.estimatedSpread,
    confidenceLevel: result.confidenceLevel,
    dealPotentialScore: result.dealPotentialScore,
    notes: input.notes ?? null,
    assumptions: result.assumptions,
    warnings: result.warnings,
    createdAt: now,
    updatedAt: now,
  };

  return { calculation, result };
}

export function computeDealPotentialForLead(leadId: string): DealPotentialScoreRecord | null {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return null;

  const latest = getLatestCalculation(leadId);
  const matches = shouldLoadSeedData()
    ? p().dealWorkflow.getBuyerMatches().filter((m) => m.leadId === leadId)
    : [];
  const packet = getLeadPacket(leadId);

  const potential = calculateDealPotentialScore({
    estimatedEquity: (lead.estimatedValue ?? 0) > 0 ? (latest?.estimatedArv ?? lead.estimatedValue ?? 0) - (lead.estimatedValue ?? 0) : undefined,
    arvSpread: latest?.estimatedSpread,
    dataConfidenceScore: lead.dataConfidenceScore,
    complianceRiskScore: lead.complianceRiskScore,
    vacancySignal: lead.vacancySignal,
    taxDelinquent: lead.taxDelinquent,
    leadMotivationScore: lead.estateLeadScore,
    buyerMatchStrength: matches[0]?.matchScore,
    documentReadiness: packet?.readinessScore,
    activeBlockers: packet?.missingDocuments.length,
    offerRangeStrength: latest ? latest.offerRangeHigh - latest.offerRangeLow : undefined,
  });

  return {
    id: `dps-${leadId}`,
    organizationId: lead.organizationId,
    leadId,
    score: potential.score,
    scoreBand: potential.scoreBand,
    positiveFactors: potential.positiveFactors,
    negativeFactors: potential.negativeFactors,
    missingData: potential.missingData,
    riskFactors: potential.riskFactors,
    confidenceLevel: potential.confidenceLevel,
    calculatedAt: new Date().toISOString(),
    calculatedBy: "system",
  };
}

export function getCalculatorOverview() {
  const calcs = getDealCalculations();
  return {
    totalCalculations: calcs.length,
    leadsCalculated: new Set(calcs.map((c) => c.leadId)).size,
    avgEstimatedSpread: calcs.length
      ? Math.round(calcs.reduce((s, c) => s + c.estimatedSpread, 0) / calcs.length)
      : 0,
  };
}
