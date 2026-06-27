import { Badge } from "@/components/ui/Badge";
import type {
  ChecklistItemStatus,
  CountySupportStatus,
  RiskRating,
  StateSupportStatus,
  BlockerSeverity,
} from "@/lib/types/compliance";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

function riskVariant(risk: RiskRating): BadgeVariant {
  const map: Record<RiskRating, BadgeVariant> = {
    low: "success",
    moderate: "info",
    elevated: "warning",
    high: "danger",
    restricted: "danger",
    attorney_review_required: "danger",
  };
  return map[risk] ?? "default";
}

function stateSupportVariant(s: StateSupportStatus): BadgeVariant {
  if (s === "fully_supported") return "success";
  if (s === "partially_supported") return "info";
  if (["research_only", "manual_upload_only", "coming_soon"].includes(s)) return "warning";
  return "danger";
}

function countySupportVariant(s: CountySupportStatus): BadgeVariant {
  if (s === "api_supported") return "success";
  if (["approved_manual", "csv_import_supported"].includes(s)) return "info";
  if (["manual_upload_only", "research_only", "coming_soon"].includes(s)) return "warning";
  return "danger";
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RiskBadge({ risk }: { risk: RiskRating }) {
  return <Badge variant={riskVariant(risk)}>{formatLabel(risk)}</Badge>;
}

export function StateSupportBadge({ status }: { status: StateSupportStatus }) {
  return <Badge variant={stateSupportVariant(status)}>{formatLabel(status)}</Badge>;
}

export function CountySupportBadge({ status }: { status: CountySupportStatus }) {
  return <Badge variant={countySupportVariant(status)}>{formatLabel(status)}</Badge>;
}

export function ChecklistStatusBadge({ status }: { status: ChecklistItemStatus }) {
  const variant: BadgeVariant =
    status === "complete" ? "success" :
    status === "blocked" ? "danger" :
    status === "needs_review" ? "warning" :
    status === "in_progress" ? "info" : "default";
  return <Badge variant={variant}>{formatLabel(status)}</Badge>;
}

export function BlockerSeverityBadge({ severity }: { severity: BlockerSeverity }) {
  const variant: BadgeVariant =
    severity === "restricted" || severity === "blocking" ? "danger" :
    severity === "elevated" ? "warning" :
    severity === "warning" ? "info" : "default";
  return <Badge variant={variant}>{formatLabel(severity)}</Badge>;
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const variant: BadgeVariant =
    score >= 85 ? "success" :
    score >= 70 ? "info" :
    score >= 50 ? "warning" : "danger";
  const text = label ? `${label}: ${score}` : `${score}/100`;
  return <Badge variant={variant}>{text}</Badge>;
}
