import type { ConfidenceLevel } from "./dealCalculatorTypes";

export function generateRiskNotes(params: {
  complianceRiskScore: number;
  dataConfidenceScore: number;
  estimatedRepairs: number;
  estimatedArv: number;
  hasBuyerMatch: boolean;
  documentReadiness?: number;
  activeBlockers?: number;
}): string[] {
  const notes: string[] = [];
  const repairRatio = params.estimatedArv > 0 ? params.estimatedRepairs / params.estimatedArv : 0;

  if (params.complianceRiskScore >= 60) {
    notes.push("Elevated compliance risk — confirm state requirements with qualified professionals.");
  }
  if (params.dataConfidenceScore < 50) {
    notes.push("Low data confidence — verify property and owner information before making offers.");
  }
  if (repairRatio > 0.25) {
    notes.push("Estimated repairs are high relative to ARV — spread assumptions may be optimistic.");
  }
  if (!params.hasBuyerMatch) {
    notes.push("Buyer demand unknown — assignment feasibility not confirmed.");
  }
  if (params.documentReadiness !== undefined && params.documentReadiness < 50) {
    notes.push("Document workflow readiness is low — required documents may be incomplete.");
  }
  if (params.activeBlockers && params.activeBlockers > 0) {
    notes.push(`${params.activeBlockers} active workflow blocker(s) may affect deal progression.`);
  }

  notes.push("User-entered assumptions drive all estimates. No profit or closing outcome is guaranteed.");
  return notes;
}

export function generateMissingDataWarnings(params: {
  estimatedArv?: number | null;
  estimatedRepairs?: number | null;
  taxAssessedValue?: number | null;
  buyerType?: string | null;
}): string[] {
  const missing: string[] = [];
  if (!params.estimatedArv || params.estimatedArv <= 0) missing.push("Estimated ARV");
  if (params.estimatedRepairs === undefined || params.estimatedRepairs === null) missing.push("Repair estimate");
  if (!params.taxAssessedValue) missing.push("Tax assessed value");
  if (!params.buyerType) missing.push("Buyer type preference");
  return missing;
}

export function determineConfidenceLevel(params: {
  missingDataCount: number;
  dataConfidenceScore: number;
  complianceRiskScore: number;
}): ConfidenceLevel {
  if (params.missingDataCount >= 3 || params.dataConfidenceScore < 40) return "manual_review_required";
  if (params.missingDataCount >= 2 || params.dataConfidenceScore < 60 || params.complianceRiskScore >= 70) return "low";
  if (params.missingDataCount >= 1 || params.dataConfidenceScore < 75) return "moderate";
  return "high";
}
