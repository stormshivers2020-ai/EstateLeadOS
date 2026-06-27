import { getLocalState, persistLocalState } from "./localStateStore";
import type { PlatformAuditLog, AuditSeverity } from "@/lib/types/platform";
import { getSessionContext } from "@/lib/config/session";

export function appendPlatformAudit(params: {
  eventType: string;
  eventDescription: string;
  severity?: AuditSeverity;
  organizationId?: string | null;
  relatedModule?: string;
  relatedRecordId?: string | null;
}): PlatformAuditLog {
  const state = getLocalState();
  const session = getSessionContext();
  const entry: PlatformAuditLog = {
    id: `pa-local-${Date.now()}`,
    organizationId: params.organizationId ?? session.organizationId,
    organizationName: session.organizationName,
    userId: session.userId,
    userName: session.userName,
    eventType: params.eventType,
    eventCategory: "local_preview",
    relatedModule: params.relatedModule ?? "local_preview",
    relatedRecordId: params.relatedRecordId ?? null,
    previousValue: null,
    newValue: "local",
    eventDescription: params.eventDescription,
    ipDevicePlaceholder: "local-preview",
    timestamp: new Date().toISOString(),
    severity: params.severity ?? "info",
    metadata: { localAudit: "true" },
  };
  state.platformAudit = [entry, ...state.platformAudit].slice(0, 500);
  persistLocalState();
  return entry;
}

export function appendCrmAudit(params: {
  leadId: string;
  eventType: string;
  description: string;
}): void {
  const state = getLocalState();
  const session = getSessionContext();
  state.crmAudit = [
    {
      id: `crm-audit-${Date.now()}`,
      leadId: params.leadId,
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.userName,
      eventType: params.eventType,
      previousValue: null,
      newValue: null,
      eventDescription: params.description,
      timestamp: new Date().toISOString(),
      relatedModule: "crm",
      riskLevel: null,
    },
    ...state.crmAudit,
  ];
  persistLocalState();
}
