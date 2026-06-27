import { initializeLocalState, setLocalState, persistLocalState, getLocalState } from "./localStateStore";
import { clearLocalState } from "./localStorageClient";
import { appendPlatformAudit } from "./localAudit";

export function resetDemoData(): void {
  const state = initializeLocalState(true);
  state.demoMode = true;
  setLocalState(state);
  appendPlatformAudit({
    eventType: "demo_data_reset",
    eventDescription: "Demo data reset to original fictional sample records",
    severity: "notice",
  });
}

export function clearLocalData(): void {
  clearLocalState();
  const state = initializeLocalState(false);
  state.demoMode = false;
  setLocalState(state);
  appendPlatformAudit({
    eventType: "local_data_cleared",
    eventDescription: "All local records cleared — fresh-start empty state",
    severity: "notice",
  });
}

export function simulateComplianceBlocker(): void {
  const state = getLocalState();
  const lead = state.leads[0];
  if (!lead) return;
  state.blockers = [
    {
      id: `blocker-sim-${Date.now()}`,
      leadId: lead.id,
      stateProfileId: `state-${lead.state.toLowerCase()}`,
      countyProfileId: null,
      workflowStage: "contact_ready",
      blockerType: "compliance_acknowledgement",
      blockerMessage: "Simulated compliance blocker — acknowledgement required before outreach preparation.",
      requiredAction: "Complete compliance wizard and required acknowledgements.",
      severity: "blocking",
      status: "active",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    },
    ...state.blockers,
  ];
  persistLocalState();
  appendPlatformAudit({
    eventType: "compliance_blocker_simulated",
    eventDescription: "Simulated compliance workflow blocker added for local preview",
    severity: "warning",
    relatedModule: "compliance",
    relatedRecordId: lead.id,
  });
}

export function simulateDocumentBlocker(): void {
  const state = getLocalState();
  const lead = state.leads[0];
  if (!lead) return;
  state.blockers = [
    {
      id: `doc-blocker-sim-${Date.now()}`,
      leadId: lead.id,
      stateProfileId: `state-${lead.state.toLowerCase()}`,
      countyProfileId: null,
      workflowStage: "needs_research",
      blockerType: "missing_document",
      blockerMessage: "Simulated document blocker — required packet documents incomplete.",
      requiredAction: "Run Document Packet Wizard and complete missing documents.",
      severity: "elevated",
      status: "active",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    },
    ...state.blockers,
  ];
  persistLocalState();
  appendPlatformAudit({
    eventType: "document_blocker_simulated",
    eventDescription: "Simulated document workflow blocker added for local preview",
    severity: "warning",
    relatedModule: "documents",
    relatedRecordId: lead.id,
  });
}

export function exportLocalStateJsonPlaceholder(): string {
  const state = getLocalState();
  return JSON.stringify({ exportedAt: new Date().toISOString(), version: state.version, demoMode: state.demoMode }, null, 2);
}
