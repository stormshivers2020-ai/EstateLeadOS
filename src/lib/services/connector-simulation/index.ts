import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import { getSampleCsvContent, importCsvLocally } from "@/lib/services/csv-import";
import type { ConnectorLogRecord } from "@/lib/local/localStateStore";

export type ConnectorSimulationType =
  | "success"
  | "blocked"
  | "failed"
  | "credentials_missing"
  | "county_unsupported"
  | "no_records";

const MESSAGES: Record<ConnectorSimulationType, string> = {
  success: "Simulated successful data pull — fictional records added to Lead Feed",
  blocked: "Source blocked — permission status does not allow automated access",
  failed: "Simulated failed data pull — connector error placeholder",
  credentials_missing: "Connector credentials missing for this organization",
  county_unsupported: "County not supported for automated data access",
  no_records: "Connector ran successfully but no matching records found",
};

export function simulateConnectorRun(type: ConnectorSimulationType, sourceName = "Harris County Probate Index"): ConnectorLogRecord {
  const state = getLocalState();
  const session = getSessionContext();
  const now = new Date().toISOString();
  const log: ConnectorLogRecord = {
    id: `conn-${Date.now()}`,
    sourceName,
    status: type === "success" ? "success" : type === "no_records" ? "no_records" : type === "county_unsupported" ? "county_unsupported" : type === "credentials_missing" ? "credentials_missing" : type === "blocked" ? "blocked" : "failed",
    message: MESSAGES[type],
    recordsAdded: type === "success" ? 3 : 0,
    createdAt: now,
  };
  state.connectorLogs = [log, ...state.connectorLogs].slice(0, 50);

  if (type === "success" && state.leads.length < 3) {
    importCsvLocally(getSampleCsvContent(), state.demoMode);
  }

  if (type === "success" && state.dashboard) {
    state.dashboard.dataSourceHealth = "healthy";
  }
  if (type === "failed" || type === "blocked") {
    state.dashboard.dataSourceHealth = "degraded";
  }

  persistLocalState();
  appendPlatformAudit({
    eventType: "connector_simulation",
    eventDescription: log.message,
    relatedModule: "data_sources",
    organizationId: session.organizationId,
  });
  return log;
}

export function getConnectorLogs() {
  return getLocalState().connectorLogs;
}
