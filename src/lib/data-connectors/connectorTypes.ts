import type { ConnectorResultStatus, SourceAccessStatus, SourceType } from "@/lib/types/data-sources";
import type { PropertyRecord } from "@/lib/types/leads";

export interface ConnectorContext {
  organizationId: string;
  state?: string;
  county?: string;
  planId?: string;
  credentials?: Record<string, string>;
}

export interface ConnectorPermissionCheck {
  allowed: boolean;
  status: ConnectorResultStatus;
  warning: string | null;
  permissionStatus: SourceAccessStatus;
}

export interface ConnectorRunResult {
  status: ConnectorResultStatus;
  message: string;
  records: Partial<PropertyRecord>[];
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  warning: string | null;
  errorDetails: string | null;
}

export interface DataConnectorInterface {
  id: string;
  name: string;
  connectorType: SourceType;
  supportedStates: string[];
  supportedCounties: string[];
  requiredCredentials: string[];
  permissionStatus: SourceAccessStatus;
  executionMethod: "api" | "manual" | "import" | "scheduled";
  reliabilityScore: number;
  freshnessScore: number;
  dataSourceId: string;
  checkPermission(context: ConnectorContext): ConnectorPermissionCheck;
  normalize(raw: Record<string, unknown>): Partial<PropertyRecord>;
  execute(context: ConnectorContext): Promise<ConnectorRunResult>;
}

export const PERMISSION_GUARD_MESSAGE =
  "This source is not currently approved for automated access. Use manual research or CSV import until SCS Nova reviews the source terms.";
