import { BUYER_MATCH_BANDS } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { Buyer, BuyerMatch, ProofOfFundsStatus } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { FullLeadDetail } from "@/lib/types/crm";
import { BUYER_MATCH_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";

export function scoreBuyerMatch(buyer: Buyer, lead: FullLeadDetail, estimatedArv?: number): {
  score: number;
  band: string;
  whyMatched: string[];
  missingInfo: string[];
  suggestedNextStep: string;
} {
  const whyMatched: string[] = [];
  const missingInfo: string[] = [];
  let score = 0;

  if (buyer.preferredStates.includes(lead.state)) {
    score += 20;
    whyMatched.push(`State match: ${lead.state}`);
  } else if (buyer.preferredStates.length === 0) {
    missingInfo.push("Buyer preferred states not set");
    score += 5;
  }

  if (buyer.preferredCounties.length === 0 || buyer.preferredCounties.some(
    (c) => c.toLowerCase() === lead.county.toLowerCase()
  )) {
    score += 15;
    whyMatched.push(`County fit: ${lead.county}`);
  }

  const propType = lead.propertyType ?? "Single Family";
  if (buyer.propertyTypes.length === 0 || buyer.propertyTypes.some(
    (t) => t.toLowerCase().includes(propType.toLowerCase().split(" ")[0])
  )) {
    score += 12;
    whyMatched.push(`Property type fit: ${propType}`);
  }

  const arv = estimatedArv ?? lead.estimatedValue ?? 0;
  if (buyer.maxPrice && arv > 0) {
    if (arv <= buyer.maxPrice) {
      score += 15;
      whyMatched.push(`Price within max: $${buyer.maxPrice.toLocaleString()}`);
    } else {
      missingInfo.push("ARV exceeds buyer max price");
      score -= 5;
    }
  } else {
    missingInfo.push("Buyer max price not set");
  }

  if (buyer.proofOfFundsStatus === "on_file") {
    score += 15;
    whyMatched.push("Proof of funds on file");
  } else if (buyer.proofOfFundsStatus === "requested") {
    score += 5;
    missingInfo.push("Proof of funds requested but not on file");
  } else {
    missingInfo.push("Proof of funds status unknown");
  }

  if (buyer.cashBuyer) {
    score += 8;
    whyMatched.push("Cash buyer");
  }

  if (buyer.status === "preferred") score += 10;
  else if (buyer.status === "active") score += 5;
  else if (buyer.status === "inactive" || buyer.status === "blocked") score -= 20;

  if (buyer.lastContacted) {
    const daysSince = (Date.now() - new Date(buyer.lastContacted).getTime()) / 86400000;
    if (daysSince < 30) {
      score += 5;
      whyMatched.push("Recently contacted");
    }
  }

  if (buyer.minimumSpread && estimatedArv) {
    whyMatched.push(`Minimum spread preference: $${buyer.minimumSpread.toLocaleString()}`);
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
  const band = BUYER_MATCH_BANDS.find((b) => score >= b.min && score <= b.max)?.label ?? "Possible Match";

  let suggestedNextStep = BUYER_MATCH_DISCLAIMER;
  if (buyer.proofOfFundsStatus !== "on_file") {
    suggestedNextStep = "Request proof of funds before sharing contract interest details.";
  } else if (score >= 70) {
    suggestedNextStep = "Contact buyer about potential contract interest — use contract-interest language, not property sale language.";
  } else {
    suggestedNextStep = "Review buy box fit and confirm buyer interest before proceeding.";
  }

  return { score, band, whyMatched, missingInfo, suggestedNextStep };
}

export function matchBuyersToLead(
  buyers: Buyer[],
  lead: FullLeadDetail,
  estimatedArv?: number
): Omit<BuyerMatch, "id" | "organizationId" | "createdAt" | "updatedAt">[] {
  return buyers
    .filter((b) => b.status !== "archived" && b.status !== "blocked")
    .map((buyer) => {
      const result = scoreBuyerMatch(buyer, lead, estimatedArv);
      return {
        leadId: lead.id,
        buyerId: buyer.id,
        matchScore: result.score,
        matchBand: result.band,
        whyMatched: result.whyMatched,
        missingInfo: result.missingInfo,
        proofOfFundsStatus: buyer.proofOfFundsStatus,
        lastContacted: buyer.lastContacted,
        suggestedNextStep: result.suggestedNextStep,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function getMatchBand(score: number): string {
  return BUYER_MATCH_BANDS.find((b) => score >= b.min && score <= b.max)?.label ?? "Possible Match";
}
