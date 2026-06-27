import type { PlanId } from "@/lib/constants/plans";

export type GatedFeature =
  | "deal_calculator"
  | "outreach_tools"
  | "state_deal_kits"
  | "buyer_network"
  | "assignment_tracker"
  | "audit_trail"
  | "advanced_reporting"
  | "api_access"
  | "white_label"
  | "csv_import"
  | "data_connectors"
  | "market_search"
  | "lead_feed"
  | "document_center"
  | "reports"
  | "exports";

export function checkFeatureAccess(_planId: PlanId, _feature: GatedFeature): {
  allowed: boolean;
  message: string;
} {
  return { allowed: true, message: "" };
}

export function checkUsageLimit(current: number, limit: number): {
  percentUsed: number;
  warningLevel: "none" | "soft" | "hard";
  message: string;
} {
  if (limit <= 0) return { percentUsed: 0, warningLevel: "none", message: "" };
  const percent = Math.round((current / limit) * 100);
  if (percent >= 100) {
    return { percentUsed: percent, warningLevel: "hard", message: "" };
  }
  if (percent >= 80) {
    return { percentUsed: percent, warningLevel: "soft", message: "" };
  }
  return { percentUsed: percent, warningLevel: "none", message: "" };
}
