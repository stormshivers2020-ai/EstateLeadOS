import "server-only";

import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { isSupabaseMode } from "@/lib/config/runtime";
import { fetchLeadsForOrg, fetchLeadById as fetchLeadByIdSupabase } from "@/lib/supabase/queries/leads";
import {
  fetchCommunicationLogs,
  fetchFollowUps,
  fetchLeadNotes,
} from "@/lib/supabase/queries/crm";
import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { toPipelineCard } from "@/lib/seed/demo-crm";
import type {
  CrmPipelineStage,
  LeadPipelineCard,
  PipelineStageChangeResult,
  CommunicationLog,
  FollowUpReminder,
  LeadNote,
} from "@/lib/types/crm";
import { getLeadComplianceContext } from "@/lib/services/compliance";
import {
  getCommunicationLogs as getCommunicationLogsSync,
  getFollowUps as getFollowUpsSync,
  getLeadNotes as getLeadNotesSync,
  getFollowUpsDue,
  getDncRecords,
  validateLeadStageChangeSync,
} from "./sync";

const provider = () => getDataProvider();

export async function getFullLeads() {
  if (isSupabaseMode()) return fetchLeadsForOrg();
  return provider().crm.getFullLeads();
}

export async function getFullLeadById(id: string) {
  if (isSupabaseMode()) return fetchLeadByIdSupabase(id);
  return provider().crm.getFullLeads().find((l) => l.id === id) ?? null;
}

export async function getDemoLeadsSummary() {
  const leads = await getFullLeads();
  return leads.map((l) => ({
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

export async function getLeadSummary(id: string) {
  const lead = await getFullLeadById(id);
  if (!lead) return null;
  return {
    id: lead.id,
    propertyAddress: lead.propertyAddress,
    ownerName: lead.ownerName,
    state: lead.state,
    county: lead.county,
    leadType: lead.primaryLeadType,
    estateLeadScore: lead.estateLeadScore,
    dealPotentialScore: lead.dealPotentialScore,
    complianceRiskScore: lead.complianceRiskScore,
    dataConfidenceScore: lead.dataConfidenceScore,
    status: lead.pipelineStage,
    origin: lead.origin,
  };
}

export async function getPipelineCards(): Promise<LeadPipelineCard[]> {
  const leads = await getFullLeads();
  return leads.map((lead) => {
    const ctx = getLeadComplianceContext(lead.id);
    const hasBlocker = (ctx?.blockers.length ?? 0) > 0;
    return toPipelineCard(lead, hasBlocker);
  });
}

export async function getPipelineCardsByStage(stage: CrmPipelineStage): Promise<LeadPipelineCard[]> {
  const cards = await getPipelineCards();
  return cards.filter((c) => c.pipelineStage === stage);
}

export async function getContactReadyLeads(): Promise<LeadPipelineCard[]> {
  const cards = await getPipelineCards();
  return cards.filter((c) => c.pipelineStage === "contact_ready" && !c.doNotContact);
}

export async function validateLeadStageChange(
  leadId: string,
  toStage: CrmPipelineStage,
  reason?: string
): Promise<PipelineStageChangeResult> {
  return validateLeadStageChangeSync(leadId, toStage, reason);
}

export async function getCommunicationLogs(leadId?: string): Promise<CommunicationLog[]> {
  if (isSupabaseMode()) return fetchCommunicationLogs(leadId);
  return getCommunicationLogsSync(leadId);
}

export async function getFollowUps(leadId?: string): Promise<FollowUpReminder[]> {
  if (isSupabaseMode()) return fetchFollowUps(leadId);
  return getFollowUpsSync(leadId);
}

export async function getLeadNotes(leadId?: string): Promise<LeadNote[]> {
  if (isSupabaseMode()) return fetchLeadNotes(leadId);
  return getLeadNotesSync(leadId);
}

export async function getOutreachOverview() {
  const demo = shouldLoadSeedData();
  if (isSupabaseMode() && !demo) {
    const [logs, followUps, cards] = await Promise.all([
      fetchCommunicationLogs(),
      fetchFollowUps(),
      getContactReadyLeads(),
    ]);
    return {
      contactReady: cards.length,
      followUpsDue: followUps.filter((f) => ["scheduled", "due_today", "overdue"].includes(f.status)).length,
      communicationsLogged: logs.length,
      dncActive: 0,
      templatesAvailable: 8,
      blockedAttempts: 0,
    };
  }
  const logs = getCommunicationLogsSync();
  const dnc = getDncRecords();
  const contactReady = demo ? (await getContactReadyLeads()).length : 0;
  return {
    contactReady,
    followUpsDue: demo ? getFollowUpsDue().length : 0,
    communicationsLogged: demo ? logs.length : 0,
    dncActive: demo ? dnc.filter((d) => d.active).length : 0,
    templatesAvailable: demo ? 8 : 0,
    blockedAttempts: demo ? 1 : 0,
  };
}
