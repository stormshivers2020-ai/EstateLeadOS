import { Badge } from "@/components/ui/Badge";
import type { AttorneyReviewStatus, DocumentStatus, SignatureStatus } from "@/lib/types/documents";

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  not_started: "default",
  generated: "info",
  draft: "warning",
  sent: "info",
  uploaded: "success",
  signed: "success",
  reviewed: "success",
  needs_attorney_review: "danger",
  approved: "success",
  rejected: "danger",
  expired: "danger",
  not_required: "default",
};

const ATTORNEY_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  not_required: "default",
  recommended: "warning",
  required: "danger",
  requested: "warning",
  in_review: "info",
  reviewed: "success",
  acknowledged: "success",
  not_available: "default",
};

const SIGNATURE_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  not_required: "default",
  needed: "warning",
  sent: "info",
  signed: "success",
  declined: "danger",
  expired: "danger",
  unknown: "default",
};

function formatLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "default"}>{formatLabel(status)}</Badge>;
}

export function AttorneyReviewBadge({ status }: { status: AttorneyReviewStatus }) {
  return <Badge variant={ATTORNEY_VARIANTS[status] ?? "default"}>{formatLabel(status)}</Badge>;
}

export function SignatureStatusBadge({ status }: { status: SignatureStatus }) {
  return <Badge variant={SIGNATURE_VARIANTS[status] ?? "default"}>{formatLabel(status)}</Badge>;
}

export function ReadinessBadge({ score, band }: { score: number; band: string }) {
  const variant =
    score >= 90 ? "success" : score >= 75 ? "info" : score >= 50 ? "warning" : "danger";
  return (
    <Badge variant={variant}>
      {score}% — {band}
    </Badge>
  );
}
