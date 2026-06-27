import { DEAL_POTENTIAL_BANDS } from "./dealCalculatorTypes";
import type { ConfidenceLevel } from "./dealCalculatorTypes";

export interface DealPotentialInput {
  estimatedEquity?: number;
  arvSpread?: number;
  repairRisk?: number;
  leadMotivationScore?: number;
  marketDemand?: number;
  buyerDemand?: number;
  dataConfidenceScore: number;
  propertyCondition?: number;
  vacancySignal?: boolean;
  taxDelinquent?: boolean;
  complianceRiskScore: number;
  sourceReliability?: number;
  offerRangeStrength?: number;
  buyerMatchStrength?: number;
  assignmentFeasibility?: number;
  documentReadiness?: number;
  activeBlockers?: number;
}

export function calculateDealPotentialScore(input: DealPotentialInput): {
  score: number;
  scoreBand: string;
  positiveFactors: string[];
  negativeFactors: string[];
  missingData: string[];
  riskFactors: string[];
  confidenceLevel: ConfidenceLevel;
} {
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  const missingData: string[] = [];
  const riskFactors: string[] = [];

  let score = 30;

  if (input.estimatedEquity && input.estimatedEquity > 50000) {
    score += 12;
    positiveFactors.push("Estimated equity appears strong");
  } else if (input.estimatedEquity === undefined) {
    missingData.push("Estimated equity");
  }

  if (input.arvSpread && input.arvSpread > 30000) {
    score += 10;
    positiveFactors.push("ARV spread supports projected range");
  } else if (!input.arvSpread) {
    missingData.push("ARV spread estimate");
  }

  if (input.repairRisk !== undefined && input.repairRisk < 0.15) {
    score += 8;
    positiveFactors.push("Repair estimate supports spread");
  } else if (input.repairRisk !== undefined && input.repairRisk > 0.25) {
    score -= 10;
    negativeFactors.push("Estimated repairs are high");
  }

  if (input.vacancySignal) {
    score += 5;
    positiveFactors.push("Vacancy signal present");
  }

  if (input.leadMotivationScore && input.leadMotivationScore > 60) {
    score += 6;
    positiveFactors.push("Lead motivation signals present");
  }

  if (input.buyerDemand && input.buyerDemand > 60) {
    score += 8;
    positiveFactors.push("Buyer demand appears strong");
  } else {
    negativeFactors.push("Buyer demand unknown");
  }

  if (input.dataConfidenceScore >= 70) {
    score += 8;
    positiveFactors.push("High data confidence");
  } else if (input.dataConfidenceScore < 50) {
    score -= 8;
    negativeFactors.push("Source confidence is low");
  }

  if (input.complianceRiskScore >= 60) {
    score -= 12;
    negativeFactors.push("Compliance risk is elevated");
    riskFactors.push("Elevated compliance risk");
  }

  if (input.documentReadiness !== undefined && input.documentReadiness >= 70) {
    score += 6;
    positiveFactors.push("Document readiness is strong");
  } else if (input.documentReadiness !== undefined && input.documentReadiness < 50) {
    score -= 6;
    negativeFactors.push("Required documents incomplete");
  }

  if (input.activeBlockers && input.activeBlockers > 0) {
    score -= input.activeBlockers * 4;
    negativeFactors.push("Active workflow blockers exist");
    riskFactors.push(`${input.activeBlockers} active blocker(s)`);
  }

  if (input.buyerMatchStrength && input.buyerMatchStrength >= 70) {
    score += 8;
    positiveFactors.push("Strong buyer match available");
  }

  if (input.offerRangeStrength && input.offerRangeStrength > 0) {
    score += 5;
  } else {
    missingData.push("Offer range calculation");
  }

  if (input.taxDelinquent) {
    score += 3;
    positiveFactors.push("Tax delinquency signal (verify locally)");
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  const band = DEAL_POTENTIAL_BANDS.find((b) => score >= b.min && score <= b.max)?.label ?? "Needs Review";

  let confidenceLevel: ConfidenceLevel = "moderate";
  if (missingData.length >= 3) confidenceLevel = "manual_review_required";
  else if (missingData.length >= 2 || input.dataConfidenceScore < 50) confidenceLevel = "low";
  else if (missingData.length === 0 && input.dataConfidenceScore >= 75) confidenceLevel = "high";

  return { score, scoreBand: band, positiveFactors, negativeFactors, missingData, riskFactors, confidenceLevel };
}

export function getDealPotentialBand(score: number): string {
  return DEAL_POTENTIAL_BANDS.find((b) => score >= b.min && score <= b.max)?.label ?? "Needs Review";
}
