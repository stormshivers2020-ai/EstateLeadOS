import { isLocalPreviewMode } from "@/lib/config/runtime";
import { DEMO_DASHBOARD_METRICS, FRESH_START_DASHBOARD_METRICS } from "@/lib/seed/demo-dashboard";
import {
  DEMO_FULL_LEADS, DEMO_COMMUNICATION_LOGS, DEMO_FOLLOW_UPS, DEMO_DNC_RECORDS,
  DEMO_NOTES, DEMO_CRM_AUDIT, DEMO_BLOCKED_TEMPLATE_EXAMPLE,
} from "@/lib/seed/demo-crm";
import {
  DEMO_DOCUMENT_RECORDS, DEMO_LEAD_PACKETS, DEMO_UPLOADED_DOCUMENTS,
  DEMO_ATTORNEY_REVIEW_QUEUE, DEMO_DOCUMENT_AUDIT,
} from "@/lib/seed/demo-documents";
import {
  DEMO_COUNTIES, DEMO_WORKFLOW_BLOCKERS, DEMO_ACKNOWLEDGEMENTS, DEMO_COMPLIANCE_AUDIT, DEMO_LEAD_COMPLIANCE,
} from "@/lib/seed/demo-compliance";
import {
  DEMO_BUYERS, DEMO_BUYER_MATCHES, DEMO_ASSIGNMENTS, DEMO_DEAL_CALCULATIONS,
} from "@/lib/seed/demo-deal-workflow";
import {
  DEMO_ORGANIZATIONS, DEMO_PLATFORM_USERS, DEMO_MARKET_LICENSES, DEMO_BILLING_ACCOUNTS,
  DEMO_USAGE_RECORDS, DEMO_WHITE_LABEL, DEMO_API_KEYS, DEMO_SUPPORT_TICKETS,
  DEMO_PLATFORM_AUDIT, DEMO_SYSTEM_HEALTH, DEMO_SCS_NOVA_SETTINGS,
} from "@/lib/seed/demo-platform";
import type { DashboardMetrics } from "@/lib/types";
import type { FullLeadDetail, CommunicationLog, FollowUpReminder, DoNotContactRecord, LeadNote, CrmAuditEvent } from "@/lib/types/crm";
import type { PlatformAuditLog } from "@/lib/types/platform";
import type { PendingInternetLead } from "@/lib/services/lead-discovery/types";
import type { LocalVerificationState } from "@/lib/services/verification/verification-state";
import { getEmptyVerificationState } from "@/lib/services/verification/verification-state";
import { seedMarylandCountyConfigs } from "@/lib/services/pipeline/local-store";
import type {
  AccruedMoneyRecord,
  DealFinancials,
  ExecutiveReport,
  ExpenseRecord,
  ProcessStepStatusRecord,
} from "@/lib/types/analytics";
import {
  DEMO_ACCRUED_MONEY,
  DEMO_DEAL_FINANCIALS,
  DEMO_EXPENSE_RECORDS,
} from "@/lib/seed/demo-analytics";
import type { AutomationState } from "@/lib/automation/automationTypes";
import { loadLocalState, saveLocalState, isBrowser, clearLocalState } from "./localStorageClient";

export interface ImportBatchRecord {
  id: string;
  organizationId: string;
  fileName: string;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  createdAt: string;
  demoRecord: boolean;
}

export interface ConnectorLogRecord {
  id: string;
  sourceName: string;
  status: "success" | "blocked" | "failed" | "credentials_missing" | "county_unsupported" | "no_records";
  message: string;
  recordsAdded: number;
  createdAt: string;
}

export interface LocalAppState {
  version: number;
  demoMode: boolean;
  dashboard: DashboardMetrics;
  leads: FullLeadDetail[];
  communicationLogs: CommunicationLog[];
  followUps: FollowUpReminder[];
  dncRecords: DoNotContactRecord[];
  notes: LeadNote[];
  crmAudit: CrmAuditEvent[];
  blockedTemplateExample: typeof DEMO_BLOCKED_TEMPLATE_EXAMPLE | null;
  documentRecords: typeof DEMO_DOCUMENT_RECORDS;
  leadPackets: typeof DEMO_LEAD_PACKETS;
  uploadedDocuments: typeof DEMO_UPLOADED_DOCUMENTS;
  attorneyQueue: typeof DEMO_ATTORNEY_REVIEW_QUEUE;
  documentAudit: typeof DEMO_DOCUMENT_AUDIT;
  counties: typeof DEMO_COUNTIES;
  blockers: typeof DEMO_WORKFLOW_BLOCKERS;
  acknowledgements: typeof DEMO_ACKNOWLEDGEMENTS;
  complianceAudit: typeof DEMO_COMPLIANCE_AUDIT;
  leadCompliance: typeof DEMO_LEAD_COMPLIANCE;
  buyers: typeof DEMO_BUYERS;
  buyerMatches: typeof DEMO_BUYER_MATCHES;
  assignments: typeof DEMO_ASSIGNMENTS;
  dealCalculations: typeof DEMO_DEAL_CALCULATIONS;
  organizations: typeof DEMO_ORGANIZATIONS;
  platformUsers: typeof DEMO_PLATFORM_USERS;
  marketLicenses: typeof DEMO_MARKET_LICENSES;
  billingAccounts: typeof DEMO_BILLING_ACCOUNTS;
  usageRecords: typeof DEMO_USAGE_RECORDS;
  whiteLabel: typeof DEMO_WHITE_LABEL;
  apiKeys: typeof DEMO_API_KEYS;
  supportTickets: typeof DEMO_SUPPORT_TICKETS;
  platformAudit: PlatformAuditLog[];
  systemHealth: typeof DEMO_SYSTEM_HEALTH;
  scsNovaSettings: typeof DEMO_SCS_NOVA_SETTINGS;
  importBatches: ImportBatchRecord[];
  connectorLogs: ConnectorLogRecord[];
  pendingInternetLeads: PendingInternetLead[];
  verification: LocalVerificationState;
  governmentSourcesOnly: boolean;
  rejectedSources: import("@/lib/types/government").RejectedSourceRecord[];
  leadGovernmentStatus: Record<string, string>;
  countyPipelineConfigs: import("@/lib/types/pipeline").CountyPipelineConfig[];
  leadPipelineItems: import("@/lib/types/pipeline").LeadPipelineItem[];
  leadPipelineEvents: import("@/lib/types/pipeline").LeadPipelineEvent[];
  automationRuns: import("@/lib/types/pipeline").AutomationRunRecord[];
  programPackets: import("@/lib/types/program").LeadPacket[];
  leadArchives: import("@/lib/types/program").LeadArchive[];
  archiveFiles: import("@/lib/types/program").ArchiveFile[];
  requiredDocuments: import("@/lib/types/program").RequiredDocument[];
  assignmentReadiness: import("@/lib/types/program").AssignmentReadiness[];
  reviewQueueItems: import("@/lib/types/program").ReviewQueueItem[];
  packetPrintLogs: import("@/lib/types/program").PacketPrintLog[];
  attorneyReviews: import("@/lib/types/distribution").AttorneyReview[];
  attorneyCompensation: import("@/lib/types/distribution").AttorneyCompensation[];
  distributionPackets: import("@/lib/types/distribution").DistributionPacket[];
  emailDistributions: import("@/lib/types/distribution").EmailDistribution[];
  externalRecipients: import("@/lib/types/distribution").ExternalRecipient[];
  distributionAuditLogs: import("@/lib/types/distribution").DistributionAuditLog[];
  dealFinancials: DealFinancials[];
  expenseRecords: ExpenseRecord[];
  accruedMoneyRecords: AccruedMoneyRecord[];
  processStepStatuses: ProcessStepStatusRecord[];
  executiveReports: ExecutiveReport[];
  billingSimulation: string;
  automation: AutomationState;
  walkthroughSessions: import("@/lib/types/walkthrough").LeadWalkthroughSession[];
  leadPacketRecords: import("@/lib/types/lead-packet").LeadPacketRecord[];
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function buildDemoState(): LocalAppState {
  return {
    version: 1,
    demoMode: true,
    dashboard: clone(DEMO_DASHBOARD_METRICS),
    leads: clone(DEMO_FULL_LEADS),
    communicationLogs: clone(DEMO_COMMUNICATION_LOGS),
    followUps: clone(DEMO_FOLLOW_UPS),
    dncRecords: clone(DEMO_DNC_RECORDS),
    notes: clone(DEMO_NOTES),
    crmAudit: clone(DEMO_CRM_AUDIT),
    blockedTemplateExample: clone(DEMO_BLOCKED_TEMPLATE_EXAMPLE),
    documentRecords: clone(DEMO_DOCUMENT_RECORDS),
    leadPackets: clone(DEMO_LEAD_PACKETS),
    uploadedDocuments: clone(DEMO_UPLOADED_DOCUMENTS),
    attorneyQueue: clone(DEMO_ATTORNEY_REVIEW_QUEUE),
    documentAudit: clone(DEMO_DOCUMENT_AUDIT),
    counties: clone(DEMO_COUNTIES),
    blockers: clone(DEMO_WORKFLOW_BLOCKERS),
    acknowledgements: clone(DEMO_ACKNOWLEDGEMENTS),
    complianceAudit: clone(DEMO_COMPLIANCE_AUDIT),
    leadCompliance: clone(DEMO_LEAD_COMPLIANCE),
    buyers: clone(DEMO_BUYERS),
    buyerMatches: clone(DEMO_BUYER_MATCHES),
    assignments: clone(DEMO_ASSIGNMENTS),
    dealCalculations: clone(DEMO_DEAL_CALCULATIONS),
    organizations: clone(DEMO_ORGANIZATIONS),
    platformUsers: clone(DEMO_PLATFORM_USERS),
    marketLicenses: clone(DEMO_MARKET_LICENSES),
    billingAccounts: clone(DEMO_BILLING_ACCOUNTS),
    usageRecords: clone(DEMO_USAGE_RECORDS),
    whiteLabel: clone(DEMO_WHITE_LABEL),
    apiKeys: clone(DEMO_API_KEYS),
    supportTickets: clone(DEMO_SUPPORT_TICKETS),
    platformAudit: clone(DEMO_PLATFORM_AUDIT),
    systemHealth: clone(DEMO_SYSTEM_HEALTH),
    scsNovaSettings: clone(DEMO_SCS_NOVA_SETTINGS),
    importBatches: [],
    connectorLogs: [],
    pendingInternetLeads: [],
    verification: getEmptyVerificationState(),
    governmentSourcesOnly: true,
    rejectedSources: [],
    leadGovernmentStatus: {},
    countyPipelineConfigs: seedMarylandCountyConfigs("scs-nova"),
    leadPipelineItems: [],
    leadPipelineEvents: [],
    automationRuns: [],
    programPackets: [],
    leadArchives: [],
    archiveFiles: [],
    requiredDocuments: [],
    assignmentReadiness: [],
    reviewQueueItems: [],
    packetPrintLogs: [],
    attorneyReviews: [],
    attorneyCompensation: [],
    distributionPackets: [],
    emailDistributions: [],
    externalRecipients: [],
    distributionAuditLogs: [],
    dealFinancials: clone(DEMO_DEAL_FINANCIALS),
    expenseRecords: clone(DEMO_EXPENSE_RECORDS),
    accruedMoneyRecords: clone(DEMO_ACCRUED_MONEY),
    processStepStatuses: [],
    executiveReports: [],
    billingSimulation: "active",
    automation: { runs: [], steps: [], approvals: [], logs: [], payoutReadiness: [], activeRunId: null },
    walkthroughSessions: [],
    leadPacketRecords: [],
  };
}

function buildFreshState(): LocalAppState {
  const demo = buildDemoState();
  return {
    ...demo,
    demoMode: false,
    dashboard: clone(FRESH_START_DASHBOARD_METRICS),
    leads: [],
    communicationLogs: [],
    followUps: [],
    dncRecords: [],
    notes: [],
    crmAudit: [],
    blockedTemplateExample: null,
    documentRecords: [],
    leadPackets: [],
    uploadedDocuments: [],
    attorneyQueue: [],
    documentAudit: [],
    counties: [],
    blockers: [],
    acknowledgements: [],
    complianceAudit: [],
    leadCompliance: [],
    buyers: [],
    buyerMatches: [],
    assignments: [],
    dealCalculations: [],
    organizations: [],
    platformUsers: [],
    marketLicenses: [],
    billingAccounts: [],
    usageRecords: [],
    whiteLabel: [],
    apiKeys: [],
    supportTickets: [],
    platformAudit: [],
    importBatches: [],
    connectorLogs: [],
    pendingInternetLeads: [],
    verification: getEmptyVerificationState(),
    governmentSourcesOnly: true,
    rejectedSources: [],
    leadGovernmentStatus: {},
    countyPipelineConfigs: seedMarylandCountyConfigs("scs-nova"),
    leadPipelineItems: [],
    leadPipelineEvents: [],
    automationRuns: [],
    programPackets: [],
    leadArchives: [],
    archiveFiles: [],
    requiredDocuments: [],
    assignmentReadiness: [],
    reviewQueueItems: [],
    packetPrintLogs: [],
    attorneyReviews: [],
    attorneyCompensation: [],
    distributionPackets: [],
    emailDistributions: [],
    externalRecipients: [],
    distributionAuditLogs: [],
    dealFinancials: [],
    expenseRecords: [],
    accruedMoneyRecords: [],
    processStepStatuses: [],
    executiveReports: [],
    billingSimulation: "trial",
    automation: { runs: [], steps: [], approvals: [], logs: [], payoutReadiness: [], activeRunId: null },
    walkthroughSessions: [],
    leadPacketRecords: [],
  };
}

let memoryState: LocalAppState | null = null;

function envDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
}

function stripDemoFromStored(stored: LocalAppState): LocalAppState {
  const fresh = buildFreshState();
  fresh.leads = stored.leads.filter((l) => !l.demoRecord && l.origin !== "demo");
  fresh.pendingInternetLeads = stored.pendingInternetLeads ?? [];
  fresh.verification = stored.verification ?? getEmptyVerificationState();
  fresh.governmentSourcesOnly = stored.governmentSourcesOnly ?? true;
  fresh.rejectedSources = stored.rejectedSources ?? [];
  fresh.leadGovernmentStatus = stored.leadGovernmentStatus ?? {};
  fresh.countyPipelineConfigs = stored.countyPipelineConfigs?.length
    ? stored.countyPipelineConfigs
    : seedMarylandCountyConfigs("scs-nova");
  fresh.leadPipelineItems = stored.leadPipelineItems ?? [];
  fresh.leadPipelineEvents = stored.leadPipelineEvents ?? [];
  fresh.automationRuns = stored.automationRuns ?? [];
  fresh.programPackets = stored.programPackets ?? [];
  fresh.leadArchives = stored.leadArchives ?? [];
  fresh.archiveFiles = stored.archiveFiles ?? [];
  fresh.requiredDocuments = stored.requiredDocuments ?? [];
  fresh.assignmentReadiness = stored.assignmentReadiness ?? [];
  fresh.reviewQueueItems = stored.reviewQueueItems ?? [];
  fresh.packetPrintLogs = stored.packetPrintLogs ?? [];
  fresh.attorneyReviews = stored.attorneyReviews ?? [];
  fresh.attorneyCompensation = stored.attorneyCompensation ?? [];
  fresh.distributionPackets = stored.distributionPackets ?? [];
  fresh.emailDistributions = stored.emailDistributions ?? [];
  fresh.externalRecipients = stored.externalRecipients ?? [];
  fresh.distributionAuditLogs = stored.distributionAuditLogs ?? [];
  fresh.dealFinancials = stored.dealFinancials ?? [];
  fresh.expenseRecords = stored.expenseRecords ?? [];
  fresh.accruedMoneyRecords = stored.accruedMoneyRecords ?? [];
  fresh.processStepStatuses = stored.processStepStatuses ?? [];
  fresh.executiveReports = stored.executiveReports ?? [];
  fresh.automation = stored.automation ?? fresh.automation;
  fresh.walkthroughSessions = stored.walkthroughSessions ?? [];
  fresh.leadPacketRecords = stored.leadPacketRecords ?? [];
  fresh.importBatches = stored.importBatches.filter((b) => !b.demoRecord);
  fresh.connectorLogs = stored.connectorLogs ?? [];
  fresh.platformAudit = (stored.platformAudit ?? []).filter(
    (e) => !e.eventDescription?.toLowerCase().includes("demo")
  );
  fresh.notes = stored.notes ?? [];
  fresh.communicationLogs = stored.communicationLogs ?? [];
  fresh.followUps = stored.followUps ?? [];
  fresh.crmAudit = stored.crmAudit ?? [];
  if (fresh.leads.length > 0) {
    fresh.dashboard = {
      ...fresh.dashboard,
      totalEstateLeads: fresh.leads.length,
      newLeadsThisWeek: fresh.leads.length,
    };
  }
  return fresh;
}

export function initializeLocalState(forceDemo?: boolean): LocalAppState {
  const demo = forceDemo ?? envDemoEnabled();
  memoryState = demo ? buildDemoState() : buildFreshState();
  if (isBrowser() && isLocalPreviewMode()) {
    saveLocalState(memoryState);
  }
  return memoryState;
}

export function getLocalState(): LocalAppState {
  if (memoryState) {
    if (!memoryState.automation) {
      memoryState.automation = { runs: [], steps: [], approvals: [], logs: [], payoutReadiness: [], activeRunId: null };
    }
    if (!memoryState.pendingInternetLeads) {
      memoryState.pendingInternetLeads = [];
    }
    if (!memoryState.verification) {
      memoryState.verification = getEmptyVerificationState();
    }
    if (memoryState.governmentSourcesOnly === undefined) {
      memoryState.governmentSourcesOnly = true;
    }
    if (!memoryState.rejectedSources) {
      memoryState.rejectedSources = [];
    }
    if (!memoryState.leadGovernmentStatus) {
      memoryState.leadGovernmentStatus = {};
    }
    if (!memoryState.countyPipelineConfigs?.length) {
      memoryState.countyPipelineConfigs = seedMarylandCountyConfigs("scs-nova");
    }
    if (!memoryState.leadPipelineItems) memoryState.leadPipelineItems = [];
    if (!memoryState.leadPipelineEvents) memoryState.leadPipelineEvents = [];
    if (!memoryState.automationRuns) memoryState.automationRuns = [];
    if (!memoryState.programPackets) memoryState.programPackets = [];
    if (!memoryState.leadArchives) memoryState.leadArchives = [];
    if (!memoryState.archiveFiles) memoryState.archiveFiles = [];
    if (!memoryState.requiredDocuments) memoryState.requiredDocuments = [];
    if (!memoryState.assignmentReadiness) memoryState.assignmentReadiness = [];
    if (!memoryState.reviewQueueItems) memoryState.reviewQueueItems = [];
    if (!memoryState.packetPrintLogs) memoryState.packetPrintLogs = [];
    if (!memoryState.attorneyReviews) memoryState.attorneyReviews = [];
    if (!memoryState.attorneyCompensation) memoryState.attorneyCompensation = [];
    if (!memoryState.distributionPackets) memoryState.distributionPackets = [];
    if (!memoryState.emailDistributions) memoryState.emailDistributions = [];
    if (!memoryState.externalRecipients) memoryState.externalRecipients = [];
    if (!memoryState.distributionAuditLogs) memoryState.distributionAuditLogs = [];
    if (!memoryState.dealFinancials) memoryState.dealFinancials = [];
    if (!memoryState.expenseRecords) memoryState.expenseRecords = [];
    if (!memoryState.accruedMoneyRecords) memoryState.accruedMoneyRecords = [];
    if (!memoryState.processStepStatuses) memoryState.processStepStatuses = [];
    if (!memoryState.executiveReports) memoryState.executiveReports = [];
    return memoryState;
  }

  if (isBrowser() && isLocalPreviewMode()) {
    const stored = loadLocalState<LocalAppState>();
    if (stored?.version === 1) {
      if (!stored.automation) {
        stored.automation = { runs: [], steps: [], approvals: [], logs: [], payoutReadiness: [], activeRunId: null };
      }
      if (!stored.pendingInternetLeads) {
        stored.pendingInternetLeads = [];
      }
      if (!stored.verification) {
        stored.verification = getEmptyVerificationState();
      }
      if (!stored.walkthroughSessions) {
        stored.walkthroughSessions = [];
      }
      if (!stored.leadPacketRecords) {
        stored.leadPacketRecords = [];
      }
      if (envDemoEnabled() && stored.demoMode) {
        memoryState = stored;
      } else {
        memoryState = stripDemoFromStored(stored);
        saveLocalState(memoryState);
      }
      return memoryState;
    }
  }

  return initializeLocalState();
}

export function setLocalState(state: LocalAppState): void {
  memoryState = state;
  if (isBrowser() && isLocalPreviewMode()) {
    saveLocalState(state);
  }
}

export function persistLocalState(): void {
  if (memoryState && isBrowser()) {
    saveLocalState(memoryState);
  }
}

export function hasLocalData(): boolean {
  if (!isLocalPreviewMode()) return envDemoEnabled();
  return getLocalState().demoMode;
}

export function isLocalDemoActive(): boolean {
  if (!isLocalPreviewMode()) return envDemoEnabled();
  return getLocalState().demoMode;
}
