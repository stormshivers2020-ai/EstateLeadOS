import { checkSourcePermission } from "@/lib/data-connectors/sourcePermissionGuard";
import type { DataSource } from "@/lib/types/data-sources";
import type { ConnectorContext } from "@/lib/data-connectors/connectorTypes";

export interface SourceCheckResult {
  sourceId: string;
  sourceName: string;
  allowed: boolean;
  status: string;
  warning: string;
  permissionStatus: string;
  action: "run_connector" | "manual_task" | "csv_import" | "pause_for_approval" | "blocked";
}

export function evaluateSourceForAutomation(
  source: DataSource,
  context: ConnectorContext
): SourceCheckResult {
  const check = checkSourcePermission(source, context);
  let action: SourceCheckResult["action"] = "blocked";

  if (check.allowed && source.permissionStatus === "approved_api") {
    action = "run_connector";
  } else if (check.allowed && source.permissionStatus === "approved_csv_import") {
    action = "csv_import";
  } else if (source.permissionStatus === "approved_manual" || check.status === "manual_review_required") {
    action = "manual_task";
  } else if (source.permissionStatus === "research_only" || source.permissionStatus === "requires_review") {
    action = "pause_for_approval";
  } else if (!check.allowed) {
    action = check.status === "blocked_by_permission_guard" ? "blocked" : "pause_for_approval";
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    allowed: check.allowed,
    status: check.status,
    warning: check.warning ?? "",
    permissionStatus: check.permissionStatus,
    action,
  };
}

export const REQUIRED_DOCUMENT_TYPES = [
  "Deed record",
  "Transfer record",
  "Tax assessor record",
  "Property record",
  "Probate court record",
  "Owner verification checklist",
  "Probate status checklist",
  "Lead source record",
  "State risk acknowledgement",
  "Compliance acknowledgement",
  "Property research sheet",
] as const;
