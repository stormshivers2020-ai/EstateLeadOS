import type { DashboardMetrics } from "@/lib/types";
import type { FullLeadDetail, CommunicationLog, FollowUpReminder, DoNotContactRecord, LeadNote, CrmAuditEvent } from "@/lib/types/crm";
import type { LocalAppState } from "@/lib/local/localStateStore";

export interface DataProvider {
  readonly type: "local" | "supabase";
  shouldLoadSeedData(): boolean;
  isDemoMode(): boolean;
  getState?(): LocalAppState;
  crm: {
    getFullLeads(): FullLeadDetail[];
    getCommunicationLogs(leadId?: string): CommunicationLog[];
    getFollowUps(leadId?: string): FollowUpReminder[];
    getDncRecords(): DoNotContactRecord[];
    getNotes(leadId?: string): LeadNote[];
    getAuditEvents(leadId?: string): CrmAuditEvent[];
    updateLeadStage(leadId: string, stage: string): boolean;
    addNote(leadId: string, content: string): LeadNote;
  };
  dashboard: {
    getMetrics(): DashboardMetrics;
  };
  platform: {
    getOrganizations(): LocalAppState["organizations"];
    getUsers(): LocalAppState["platformUsers"];
    getMarketLicenses(): LocalAppState["marketLicenses"];
    getBillingAccounts(): LocalAppState["billingAccounts"];
    getUsageRecords(): LocalAppState["usageRecords"];
    getSupportTickets(): LocalAppState["supportTickets"];
    getPlatformAudit(): LocalAppState["platformAudit"];
    getSystemHealth(): LocalAppState["systemHealth"];
    getScsNovaSettings(): LocalAppState["scsNovaSettings"];
    getWhiteLabel(): LocalAppState["whiteLabel"];
    getApiKeys(): LocalAppState["apiKeys"];
  };
  documents: {
    getRecords(): LocalAppState["documentRecords"];
    getPackets(): LocalAppState["leadPackets"];
    getUploads(): LocalAppState["uploadedDocuments"];
    getAttorneyQueue(): LocalAppState["attorneyQueue"];
    getAudit(): LocalAppState["documentAudit"];
  };
  compliance: {
    getCounties(): LocalAppState["counties"];
    getBlockers(): LocalAppState["blockers"];
    getAcknowledgements(): LocalAppState["acknowledgements"];
    getLeadCompliance(): LocalAppState["leadCompliance"];
  };
  dealWorkflow: {
    getBuyers(): LocalAppState["buyers"];
    getBuyerMatches(): LocalAppState["buyerMatches"];
    getAssignments(): LocalAppState["assignments"];
    getCalculations(): LocalAppState["dealCalculations"];
  };
  import: {
    getBatches(): LocalAppState["importBatches"];
  };
  connector: {
    getLogs(): LocalAppState["connectorLogs"];
  };
}
