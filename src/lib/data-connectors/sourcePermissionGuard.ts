import type { DataSource } from "@/lib/types/data-sources";
import type { ConnectorContext, ConnectorPermissionCheck } from "./connectorTypes";
import { PERMISSION_GUARD_MESSAGE } from "./connectorTypes";

const APPROVED_STATUSES = new Set([
  "approved_api",
  "approved_manual",
  "approved_csv_import",
  "paid_provider",
]);

const BLOCKED_STATUSES = new Set(["blocked", "not_available", "unknown"]);

const MANUAL_ONLY_STATUSES = new Set(["approved_manual", "research_only"]);

export function checkSourcePermission(
  source: DataSource,
  context: ConnectorContext
): ConnectorPermissionCheck {
  if (!source.active) {
    return {
      allowed: false,
      status: "source_unavailable",
      warning: "This data source is currently inactive.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (BLOCKED_STATUSES.has(source.permissionStatus)) {
    return {
      allowed: false,
      status: "blocked_by_permission_guard",
      warning: PERMISSION_GUARD_MESSAGE,
      permissionStatus: source.permissionStatus,
    };
  }

  if (source.permissionStatus === "requires_review") {
    return {
      allowed: false,
      status: "terms_review_required",
      warning: "Source terms require SCS Nova review before automated access.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (source.permissionStatus === "research_only") {
    return {
      allowed: false,
      status: "manual_review_required",
      warning: "This source is research-only. Use manual research or CSV import.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (source.termsStatus === "unknown" || source.termsStatus === "pending") {
    return {
      allowed: false,
      status: "terms_review_required",
      warning: "Source terms are not yet reviewed. Automated access is disabled.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (source.permissionStatus === "paid_provider" && !context.credentials?.apiKey) {
    return {
      allowed: false,
      status: "credentials_missing",
      warning: "Paid provider credentials are required but not configured.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (context.state && source.state && source.state !== context.state) {
    return {
      allowed: false,
      status: "county_unsupported",
      warning: `Source is configured for ${source.state}, not ${context.state}.`,
      permissionStatus: source.permissionStatus,
    };
  }

  if (context.county && source.county && source.county !== context.county) {
    return {
      allowed: false,
      status: "county_unsupported",
      warning: `Source is configured for ${source.county} county only.`,
      permissionStatus: source.permissionStatus,
    };
  }

  if (!APPROVED_STATUSES.has(source.permissionStatus)) {
    return {
      allowed: false,
      status: "blocked_by_permission_guard",
      warning: PERMISSION_GUARD_MESSAGE,
      permissionStatus: source.permissionStatus,
    };
  }

  if (MANUAL_ONLY_STATUSES.has(source.permissionStatus) && source.accessMethod !== "import") {
    return {
      allowed: false,
      status: "manual_review_required",
      warning: "This source is manual-only. Use CSV import or manual research workflow.",
      permissionStatus: source.permissionStatus,
    };
  }

  if (source.freshnessScore < 20) {
    return {
      allowed: false,
      status: "source_unavailable",
      warning: "Source data is stale. SCS Nova recommends refreshing before use.",
      permissionStatus: source.permissionStatus,
    };
  }

  return {
    allowed: true,
    status: "success",
    warning: source.legalAccessWarning,
    permissionStatus: source.permissionStatus,
  };
}

export function getSourceWarnings(source: DataSource): string[] {
  const warnings: string[] = [];
  if (source.termsStatus === "unknown" || source.termsStatus === "pending") {
    warnings.push("Source terms are unknown or pending review");
  }
  if (source.permissionStatus === "blocked") warnings.push("Source is blocked");
  if (source.permissionStatus === "research_only") warnings.push("Source is research-only");
  if (source.adminApprovalStatus !== "approved") warnings.push("Source has not been admin-approved");
  if (source.freshnessScore < 40) warnings.push("Source data may be stale");
  if (source.lastSyncResult === "failed") warnings.push("Source failed on last sync");
  if (source.permissionStatus === "approved_manual") warnings.push("Source is manual-only");
  if (source.permissionStatus === "paid_provider") warnings.push("Source requires paid credentials");
  return warnings;
}
