import type { DataProvider } from "./dataProvider";
import { getLocalState, isLocalDemoActive, hasLocalData, persistLocalState } from "@/lib/local/localStateStore";
import type { DashboardMetrics } from "@/lib/types";
import { FRESH_START_DASHBOARD_METRICS } from "@/lib/seed/demo-dashboard";
import { appendCrmAudit, appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import type { LeadNote } from "@/lib/types/crm";

function createLocalProvider(): DataProvider {
  return {
    type: "local",
    shouldLoadSeedData: () => hasLocalData(),
    isDemoMode: () => isLocalDemoActive(),
    getState: () => getLocalState(),

    crm: {
      getFullLeads: () => getLocalState().leads,
      getCommunicationLogs: (leadId) => {
        const logs = getLocalState().communicationLogs;
        return leadId ? logs.filter((l) => l.leadId === leadId) : logs;
      },
      getFollowUps: (leadId) => {
        const items = getLocalState().followUps;
        return leadId ? items.filter((f) => f.leadId === leadId) : items;
      },
      getDncRecords: () => getLocalState().dncRecords,
      getNotes: (leadId) => {
        const notes = getLocalState().notes;
        return leadId ? notes.filter((n) => n.leadId === leadId) : notes;
      },
      getAuditEvents: (leadId) => {
        const events = getLocalState().crmAudit;
        return leadId ? events.filter((e) => e.leadId === leadId) : events;
      },
      updateLeadStage(leadId, stage) {
        const state = getLocalState();
        const lead = state.leads.find((l) => l.id === leadId);
        if (!lead) return false;
        const prev = lead.pipelineStage;
        lead.pipelineStage = stage as typeof lead.pipelineStage;
        lead.updatedAt = new Date().toISOString();
        appendCrmAudit({ leadId, eventType: "pipeline_stage_change", description: `Stage changed from ${prev} to ${stage}` });
        persistLocalState();
        return true;
      },
      addNote(leadId, content) {
        const session = getSessionContext();
        const note: LeadNote = {
          id: `note-${Date.now()}`,
          leadId,
          organizationId: session.organizationId,
          userId: session.userId,
          userName: session.userName,
          noteType: "general",
          body: content,
          visibility: "team",
          pinned: false,
          edited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const state = getLocalState();
        state.notes = [note, ...state.notes];
        appendCrmAudit({ leadId, eventType: "note_added", description: "Note added to lead" });
        persistLocalState();
        return note;
      },
    },

    dashboard: {
      getMetrics(): DashboardMetrics {
        const state = getLocalState();
        if (!state.demoMode && state.leads.length === 0) {
          return FRESH_START_DASHBOARD_METRICS;
        }
        if (state.leads.length > 0 && !state.demoMode) {
          return {
            ...FRESH_START_DASHBOARD_METRICS,
            totalEstateLeads: state.leads.length,
            newLeadsThisWeek: state.leads.length,
            highScoreLeads: state.leads.filter((l) => l.estateLeadScore >= 75).length,
            leadsByState: Object.entries(
              state.leads.reduce<Record<string, number>>((acc, l) => {
                acc[l.state] = (acc[l.state] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([state, count]) => ({ state, count })),
            leadsByCounty: Object.entries(
              state.leads.reduce<Record<string, { state: string; count: number }>>((acc, l) => {
                const key = `${l.county}|${l.state}`;
                if (!acc[key]) acc[key] = { state: l.state, count: 0 };
                acc[key].count += 1;
                return acc;
              }, {})
            ).map(([key, v]) => ({ county: key.split("|")[0], state: v.state, count: v.count })),
          };
        }
        return state.dashboard;
      },
    },

    platform: {
      getOrganizations: () => getLocalState().organizations,
      getUsers: () => getLocalState().platformUsers,
      getMarketLicenses: () => getLocalState().marketLicenses,
      getBillingAccounts: () => getLocalState().billingAccounts,
      getUsageRecords: () => getLocalState().usageRecords,
      getSupportTickets: () => getLocalState().supportTickets,
      getPlatformAudit: () => getLocalState().platformAudit,
      getSystemHealth: () => getLocalState().systemHealth,
      getScsNovaSettings: () => getLocalState().scsNovaSettings,
      getWhiteLabel: () => getLocalState().whiteLabel,
      getApiKeys: () => getLocalState().apiKeys,
    },

    documents: {
      getRecords: () => getLocalState().documentRecords,
      getPackets: () => getLocalState().leadPackets,
      getUploads: () => getLocalState().uploadedDocuments,
      getAttorneyQueue: () => getLocalState().attorneyQueue,
      getAudit: () => getLocalState().documentAudit,
    },

    compliance: {
      getCounties: () => getLocalState().counties,
      getBlockers: () => getLocalState().blockers,
      getAcknowledgements: () => getLocalState().acknowledgements,
      getLeadCompliance: () => getLocalState().leadCompliance,
    },

    dealWorkflow: {
      getBuyers: () => getLocalState().buyers,
      getBuyerMatches: () => getLocalState().buyerMatches,
      getAssignments: () => getLocalState().assignments,
      getCalculations: () => getLocalState().dealCalculations,
    },

    import: {
      getBatches: () => getLocalState().importBatches,
    },

    connector: {
      getLogs: () => getLocalState().connectorLogs,
    },
  };
}

let localProvider: DataProvider | null = null;

export function getLocalDataProvider(): DataProvider {
  if (!localProvider) localProvider = createLocalProvider();
  return localProvider;
}

export function simulateBillingStatus(status: string): void {
  const state = getLocalState();
  state.billingSimulation = status;
  if (state.billingAccounts[0]) {
    state.billingAccounts[0].billingStatus = status as typeof state.billingAccounts[0]["billingStatus"];
  }
  appendPlatformAudit({
    eventType: "billing_simulation",
    eventDescription: `Billing status simulated: ${status}`,
    severity: "notice",
    relatedModule: "billing",
  });
  persistLocalState();
}
