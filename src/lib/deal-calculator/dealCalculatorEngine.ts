import type { DealCalculatorInput, DealCalculationResult } from "./dealCalculatorTypes";
import { calculateInvestorMaxOffer, calculateSuggestedSellerOffer, calculateOfferRange } from "./offerRangeEngine";
import { calculateEstimatedSpread } from "./spreadEstimateEngine";
import { calculateDealPotentialScore } from "./dealPotentialScoring";
import { generateRiskNotes, generateMissingDataWarnings, determineConfidenceLevel } from "./dealRiskNotes";
import { CALCULATOR_DISCLAIMER } from "./dealCalculatorTypes";

export interface LeadContextForCalculator {
  dataConfidenceScore: number;
  complianceRiskScore: number;
  dealPotentialScore?: number;
  estimatedValue?: number | null;
  taxAssessedValue?: number | null;
  vacancySignal?: boolean;
  taxDelinquent?: boolean;
  estateLeadScore?: number;
}

export function runDealCalculation(
  input: DealCalculatorInput,
  leadContext: LeadContextForCalculator,
  options?: { buyerMatchStrength?: number; documentReadiness?: number; activeBlockers?: number }
): DealCalculationResult {
  const investorMaxOffer = calculateInvestorMaxOffer({
    estimatedArv: input.estimatedArv,
    investorDiscountPercentage: input.investorDiscountPercentage,
    estimatedRepairs: input.estimatedRepairs,
    holdingCosts: input.holdingCosts,
    closingCosts: input.closingCosts,
    riskBuffer: input.riskBuffer,
    marketDemandAdjustment: input.marketDemandAdjustment,
    propertyConditionAdjustment: input.propertyConditionAdjustment,
    complianceRiskAdjustment: input.complianceRiskAdjustment ?? leadContext.complianceRiskScore * 0.1,
  });

  const suggestedSellerOffer = calculateSuggestedSellerOffer(
    investorMaxOffer,
    input.targetAssignmentSpread
  );

  const offerRange = calculateOfferRange(suggestedSellerOffer, input.riskBuffer ?? 0);
  const estimatedSpread = calculateEstimatedSpread(
    investorMaxOffer,
    suggestedSellerOffer,
    input.targetAssignmentSpread
  );

  const missingData = generateMissingDataWarnings({
    estimatedArv: input.estimatedArv,
    estimatedRepairs: input.estimatedRepairs,
    taxAssessedValue: input.taxAssessedValue ?? leadContext.taxAssessedValue,
    buyerType: input.buyerType,
  });

  const repairRatio = input.estimatedArv > 0 ? input.estimatedRepairs / input.estimatedArv : 0;
  const estimatedEquity = input.estimatedArv - (input.estimatedCurrentValue ?? leadContext.estimatedValue ?? 0);

  const potential = calculateDealPotentialScore({
    estimatedEquity: estimatedEquity > 0 ? estimatedEquity : undefined,
    arvSpread: estimatedSpread,
    repairRisk: repairRatio,
    leadMotivationScore: leadContext.estateLeadScore,
    buyerDemand: options?.buyerMatchStrength,
    dataConfidenceScore: leadContext.dataConfidenceScore,
    vacancySignal: leadContext.vacancySignal,
    taxDelinquent: leadContext.taxDelinquent,
    complianceRiskScore: leadContext.complianceRiskScore,
    offerRangeStrength: offerRange.high - offerRange.low,
    buyerMatchStrength: options?.buyerMatchStrength,
    documentReadiness: options?.documentReadiness,
    activeBlockers: options?.activeBlockers,
    assignmentFeasibility: estimatedSpread > 10000 ? 70 : 40,
  });

  const confidenceLevel = determineConfidenceLevel({
    missingDataCount: missingData.length,
    dataConfidenceScore: leadContext.dataConfidenceScore,
    complianceRiskScore: leadContext.complianceRiskScore,
  });

  const riskNotes = generateRiskNotes({
    complianceRiskScore: leadContext.complianceRiskScore,
    dataConfidenceScore: leadContext.dataConfidenceScore,
    estimatedRepairs: input.estimatedRepairs,
    estimatedArv: input.estimatedArv,
    hasBuyerMatch: (options?.buyerMatchStrength ?? 0) > 50,
    documentReadiness: options?.documentReadiness,
    activeBlockers: options?.activeBlockers,
  });

  const assumptions = [
    `ARV: $${input.estimatedArv.toLocaleString()} (user-entered)`,
    `Investor discount: ${input.investorDiscountPercentage}%`,
    `Repairs: $${input.estimatedRepairs.toLocaleString()}`,
    `Holding costs: $${input.holdingCosts.toLocaleString()}`,
    `Closing costs: $${input.closingCosts.toLocaleString()}`,
    `Target assignment spread: $${input.targetAssignmentSpread.toLocaleString()}`,
    `Risk buffer: $${(input.riskBuffer ?? 0).toLocaleString()}`,
  ];

  const warnings = [CALCULATOR_DISCLAIMER];
  if (missingData.length > 0) {
    warnings.push(`Missing data: ${missingData.join(", ")}`);
  }

  return {
    investorMaxOffer,
    suggestedSellerOffer,
    offerRangeLow: offerRange.low,
    offerRangeHigh: offerRange.high,
    estimatedSpread,
    confidenceLevel,
    dealPotentialScore: potential.score,
    warnings,
    missingData,
    assumptions,
    riskNotes: [...riskNotes, ...potential.riskFactors],
  };
}
