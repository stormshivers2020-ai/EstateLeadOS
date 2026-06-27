import { Badge } from "@/components/ui/Badge";

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrgStatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" || status === "enterprise" ? "success"
    : status === "trial" ? "info"
    : status === "past_due" ? "danger"
    : status === "suspended" || status === "cancelled" ? "warning"
    : "default";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}

export function BillingStatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" || status === "comped" ? "success"
    : status === "trial" ? "info"
    : status === "past_due" ? "danger"
    : status === "enterprise_invoice" ? "info"
    : status === "suspended" ? "warning"
    : "default";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}

export function PlanBadge({ plan }: { plan: string }) {
  return <Badge variant="info">{fmt(plan)}</Badge>;
}

export function LicenseStatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" ? "success" : status === "trial" ? "info"
    : status === "expired" || status === "suspended" ? "danger"
    : status === "pending" ? "warning" : "default";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}

export function HealthStatusBadge({ status }: { status: string }) {
  const variant =
    status === "operational" ? "success"
    : status === "degraded" ? "warning"
    : status === "maintenance" ? "info"
    : "danger";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}

export function TicketStatusBadge({ status }: { status: string }) {
  const variant =
    status === "resolved" || status === "closed" ? "success"
    : status === "open" || status === "in_review" ? "info"
    : status === "new" ? "warning"
    : "default";
  return <Badge variant={variant}>{fmt(status)}</Badge>;
}

export function AuditSeverityBadge({ severity }: { severity: string }) {
  const variant =
    severity === "critical" || severity === "security" ? "danger"
    : severity === "warning" || severity === "compliance" ? "warning"
    : severity === "notice" ? "info"
    : "default";
  return <Badge variant={variant}>{fmt(severity)}</Badge>;
}

export function WhiteLabelBadge({ enabled, approved }: { enabled: boolean; approved: boolean }) {
  if (!enabled) return <Badge variant="default">Disabled</Badge>;
  if (!approved) return <Badge variant="warning">Pending Approval</Badge>;
  return <Badge variant="success">Active</Badge>;
}
