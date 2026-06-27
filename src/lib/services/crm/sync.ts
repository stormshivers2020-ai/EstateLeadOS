import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { isSupabaseMode } from "@/lib/config/runtime";
import { getClientLeadsCache } from "@/lib/config/session";
import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { validateStageChange } from "@/lib/engines/pipeline-stage-guard";
import { runLeadComplianceCheck } from "@/lib/services/compliance";
import { DEMO_BLOCKED_TEMPLATE_EXAMPLE } from "@/lib/seed/demo-crm";
import { toPipelineCard } from "@/lib/seed/demo-crm";
import type {
  CrmPipelineStage,
  CommunicationLog,
  FollowUpReminder,
  DoNotContactRecord,
  LeadNote,
  CrmAuditEvent,
  LeadPipelineCard,
  PipelineStageChangeResult,
} from "@/lib/types/crm";
import type { DealType, AcquisitionStrategy } from "@/lib/types/compliance";
import { getLeadComplianceContext } from "@/lib/services/compliance";

const provider = () => getDataProvider();

/** Sync resolver for client modules — uses local provider or client leads cache. */
export function getFullLeadByIdSync(id: string) {
  if (isSupabaseMode()) {
    return getClientLeadsCache().find((l) => l.id === id) ?? null;
  }
  return provider().crm.getFullLeads().find((l) => l.id === id) ?? null;
}

export function getFullLeadsSync() {
  if (isSupabaseMode()) return getClientLeadsCache();
  return provider().crm.getFullLeads();
}

export function getDemoLeadsSummarySync() {
  return getFullLeadsSync().map((l) => ({
    id: l.id,
    propertyAddress: l.propertyAddress,
    ownerName: l.ownerName,
    state: l.state,
    county: l.county,
    leadType: l.primaryLeadType,
    estateLeadScore: l.estateLeadScore,
    dealPotentialScore: l.dealPotentialScore,
    complianceRiskScore: l.complianceRiskScore,
    dataConfidenceScore: l.dataConfidenceScore,
    status: l.pipelineStage,
    origin: l.origin as "auto_discovered" | "csv_imported" | "manually_added" | "demo",
    doNotContact: l.doNotContact,
    assignedUserName: l.assignedUserName ?? undefined,
    nextAction: l.nextAction ?? undefined,
    updatedAt: l.updatedAt,
    signalSummary: l.signals.slice(0, 2).map((s) => s.name).join(" · ") || "Manual verification required",
    sourceStatus: l.sourceRecords[0]?.permissionStatus?.replace(/_/g, " ") ?? "Source pending review",
  }));
}

export function getCommunicationLogs(leadId?: string): CommunicationLog[] {
  return provider().crm.getCommunicationLogs(leadId);
}

export function getFollowUps(leadId?: string): FollowUpReminder[] {
  return provider().crm.getFollowUps(leadId);
}

export function getDncRecords(): DoNotContactRecord[] {
  return provider().crm.getDncRecords();
}

export function getLeadNotes(leadId?: string): LeadNote[] {
  return provider().crm.getNotes(leadId);
}

export function getCrmAuditEvents(leadId?: string): CrmAuditEvent[] {
  return provider().crm.getAuditEvents(leadId);
}

export function getFollowUpsDue(): FollowUpReminder[] {
  return getFollowUps().filter((f) => ["scheduled", "due_today", "overdue"].includes(f.status));
}

export function getBlockedTemplateExample() {
  return shouldLoadSeedData() ? DEMO_BLOCKED_TEMPLATE_EXAMPLE : null;
}

/** Local/demo pipeline cards — server pages should use `crm/server` in Supabase mode. */
export function getPipelineCardsSync(): LeadPipelineCard[] {
  const leads = getFullLeadsSync();
  return leads.map((lead) => {
    const ctx = getLeadComplianceContext(lead.id);
    const hasBlocker = (ctx?.blockers.length ?? 0) > 0;
    return toPipelineCard(lead, hasBlocker);
  });
}

export function validateLeadStageChangeSync(
  leadId: string,
  toStage: CrmPipelineStage,
  reason?: string
): PipelineStageChangeResult {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) {
    return {
      allowed: false,
      fromStage: "new_lead",
      toStage,
      blockedReason: "Lead not found",
      complianceMessage: null,
    };
  }

  const ctx = getLeadComplianceContext(leadId);
  let complianceCheck = null;

  if (ctx) {
    complianceCheck = runLeadComplianceCheck({
      stateAbbr: lead.state,
      countyName: lead.county,
      dealType: (ctx.dealType ?? "direct_purchase") as DealType,
      acquisitionStrategy: (ctx.acquisitionStrategy ?? "direct_acquisition") as AcquisitionStrategy,
      leadId,
      ownerIdentityVerified: ctx.ownerIdentityVerified,
      sourceDocumentsAttached: ctx.sourceDocumentsAttached,
      communicationLogActive: getCommunicationLogs(leadId).length > 0,
      acknowledgementsComplete: ctx.acknowledgements.length > 0,
    });
  }

  const documents = provider().documents.getRecords().filter((d) => d.leadId === leadId);

  return validateStageChange(lead.pipelineStage, toStage, {
    doNotContact: lead.doNotContact,
    complianceCheck,
    reason,
    documents,
    leadId,
  });
}

export function getOutreachOverviewSync() {
  const demo = shouldLoadSeedData();
  const logs = getCommunicationLogs();
  const dnc = getDncRecords();
  const contactReady = demo ? getPipelineCardsSync().filter((c) => c.pipelineStage === "contact_ready" && !c.doNotContact).length : 0;
  return {
    contactReady,
    followUpsDue: demo ? getFollowUpsDue().length : 0,
    communicationsLogged: demo ? logs.length : 0,
    dncActive: demo ? dnc.filter((d) => d.active).length : 0,
    templatesAvailable: demo ? 8 : 0,
    blockedAttempts: demo ? 1 : 0,
  };
}
