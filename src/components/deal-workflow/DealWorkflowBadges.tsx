import { Badge } from "@/components/ui/Badge";
import type { AssignmentStage, ConfidenceLevel } from "@/lib/deal-calculator/dealCalculatorTypes";

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel | string }) {
  const variant =
    level === "high" ? "success" : level === "moderate" ? "info" : level === "low" ? "warning" : "danger";
  return <Badge variant={variant}>{fmt(level)}</Badge>;
}

export function DealPotentialBadge({ score, band }: { score: number; band: string }) {
  const variant =
    score >= 85 ? "success" : score >= 70 ? "info" : score >= 50 ? "warning" : score >= 25 ? "default" : "danger";
  return <Badge variant={variant}>{score} — {band}</Badge>;
}

export function BuyerMatchBadge({ score, band }: { score: number; band: string }) {
  const variant =
    score >= 85 ? "success" : score >= 70 ? "info" : score >= 50 ? "warning" : "default";
  return <Badge variant={variant}>{score}% — {band}</Badge>;
}

export function AssignmentStageBadge({ stage }: { stage: AssignmentStage | string }) {
  const variant =
    stage === "closed" || stage === "fee_recorded" ? "success"
    : stage === "cancelled" ? "danger"
    : stage.includes("disclosure") || stage === "compliance_review" ? "warning"
    : "info";
  return <Badge variant={variant}>{fmt(stage)}</Badge>;
}

export function PofBadge({ status }: { status: string }) {
  const variant =
    status === "on_file" ? "success" : status === "requested" ? "warning" : status === "expired" ? "danger" : "default";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}
