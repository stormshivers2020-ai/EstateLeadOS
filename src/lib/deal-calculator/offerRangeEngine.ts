export function calculateInvestorMaxOffer(params: {
  estimatedArv: number;
  investorDiscountPercentage: number;
  estimatedRepairs: number;
  holdingCosts: number;
  closingCosts: number;
  riskBuffer?: number;
  marketDemandAdjustment?: number;
  propertyConditionAdjustment?: number;
  complianceRiskAdjustment?: number;
}): number {
  const discount = params.investorDiscountPercentage / 100;
  const marketAdj = 1 + (params.marketDemandAdjustment ?? 0) / 100;
  const conditionAdj = 1 - Math.abs(params.propertyConditionAdjustment ?? 0) / 100;
  const complianceAdj = 1 - (params.complianceRiskAdjustment ?? 0) / 100;

  let offer =
    params.estimatedArv * discount * marketAdj * conditionAdj * complianceAdj -
    params.estimatedRepairs -
    params.holdingCosts -
    params.closingCosts -
    (params.riskBuffer ?? 0);

  return Math.max(0, Math.round(offer));
}

export function calculateSuggestedSellerOffer(
  investorMaxOffer: number,
  targetAssignmentSpread: number
): number {
  return Math.max(0, Math.round(investorMaxOffer - targetAssignmentSpread));
}

export function calculateOfferRange(
  suggestedSellerOffer: number,
  riskBuffer: number
): { low: number; high: number } {
  const buffer = riskBuffer || suggestedSellerOffer * 0.03;
  return {
    low: Math.max(0, Math.round(suggestedSellerOffer - buffer)),
    high: Math.round(suggestedSellerOffer + buffer),
  };
}
