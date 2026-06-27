export function calculateEstimatedSpread(
  investorMaxOffer: number,
  suggestedSellerOffer: number,
  targetAssignmentSpread: number
): number {
  const spreadFromOffers = investorMaxOffer - suggestedSellerOffer;
  return Math.round(Math.max(spreadFromOffers, targetAssignmentSpread));
}
