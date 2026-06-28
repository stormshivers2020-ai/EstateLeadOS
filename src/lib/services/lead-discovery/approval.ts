import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { persistVerificationForCandidateAsync } from "@/lib/services/verification";
import {
  approvePendingLead as approvePendingLeadSupabase,
  fetchPendingInternetLeads as fetchPendingSupabase,
  insertPendingInternetLead,
  rejectPendingLead as rejectPendingLeadSupabase,
} from "@/lib/supabase/queries/leads";
import { DEMO_FULL_LEADS } from "@/lib/seed/demo-crm";
import type { FullLeadDetail } from "@/lib/types/crm";
import type { LeadSearchCandidate, PendingInternetLead } from "./types";
import { PENDING_INTERNET_NEXT_ACTION } from "./types";

export type { PendingInternetLead } from "./types";

function candidateToLocalLead(candidate: LeadSearchCandidate, organizationId: string): FullLeadDetail {
  const now = new Date().toISOString();
  const template = DEMO_FULL_LEADS[0];
  return {
    ...template,
    id: `lead-web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId,
    propertyAddress: candidate.propertyAddress,
    street: candidate.propertyAddress.split(",")[0]?.trim() ?? candidate.propertyAddress,
    city: candidate.city ?? "",
    state: candidate.state,
    county: candidate.county,
    ownerName: candidate.ownerName ?? "Unknown — verify via research wizard",
    primaryLeadType: candidate.leadType as FullLeadDetail["primaryLeadType"],
    estateLeadScore: candidate.estateLeadScore,
    dealPotentialScore: candidate.dealPotentialScore,
    complianceRiskScore: candidate.complianceRiskScore,
    dataConfidenceScore: candidate.dataConfidenceScore,
    origin: "auto_discovered",
    pipelineStage: "new_lead",
    nextAction: "Run Probate Research Wizard — verify before outreach",
    demoRecord: false,
    createdAt: now,
    updatedAt: now,
    signals: candidate.signals.map((signal, i) => ({
      name: signal,
      category: signal.toLowerCase().includes("probate") ? "probate" : "inheritance",
      explanation: candidate.snippet,
      confidence: Math.min(90, candidate.dataConfidenceScore + i * 2),
    })),
    sourceRecords: [
      {
        id: `src-web-${Date.now()}`,
        sourceName: "Internet Search",
        sourceType: "public_notice",
        sourceUrl: candidate.sourceUrl,
        retrievedAt: now,
        reliabilityScore: 52,
        freshnessScore: 68,
        permissionStatus: "research_only",
        fieldsProvided: ["property_address", "web_snippet", "source_url"],
      },
    ],
    ownerHeir: {
      ...template.ownerHeir,
      currentOwnerName: candidate.ownerName,
      propertyAddress: candidate.propertyAddress,
      ownerVerificationStatus: "needs_research",
      notes: `Approved from internet search: ${candidate.sourceTitle}`,
    },
    missingData: ["Verify property address", "Confirm owner/heir", "Attach court or deed records"],
    manualVerificationNeeded: ["Owner/heir authority", "Property address accuracy", "Source URL review"],
  };
}

function toPendingSummary(p: PendingInternetLead) {
  return {
    id: p.id,
    propertyAddress: p.candidate.propertyAddress,
    ownerName: p.candidate.ownerName ?? "Unknown",
    sourceUrl: p.candidate.sourceUrl,
    state: p.candidate.state,
    county: p.candidate.county,
    estateLeadScore: p.candidate.estateLeadScore,
    dataConfidenceScore: p.candidate.dataConfidenceScore,
    snippet: p.candidate.snippet,
    sourceTitle: p.candidate.sourceTitle,
    discoveredAt: p.discoveredAt,
    searchId: p.searchId,
    isGovernmentSource: p.candidate.isGovernmentSource ?? false,
    governmentVerificationStatus: p.candidate.governmentVerificationStatus ?? null,
  };
}

function extractSourceUrlFromNextAction(nextAction: string | null | undefined): string {
  const match = nextAction?.match(/https?:\/\/\S+/);
  return match?.[0]?.replace(/[.,;)]+$/, "") ?? "";
}

export async function getPendingInternetLeads() {
  if (isSupabaseMode()) {
    const rows = await fetchPendingSupabase();
    return rows.map((lead) => ({
      id: lead.id,
      propertyAddress: lead.propertyAddress,
      ownerName: lead.ownerName,
      sourceUrl: lead.sourceRecords[0]?.sourceUrl ?? extractSourceUrlFromNextAction(lead.nextAction),
      state: lead.state,
      county: lead.county,
      estateLeadScore: lead.estateLeadScore,
      dataConfidenceScore: lead.dataConfidenceScore,
      snippet: lead.nextAction ?? "",
      sourceTitle: lead.sourceRecords[0]?.sourceName ?? "Internet Search",
      discoveredAt: lead.createdAt,
      searchId: lead.id,
      isGovernmentSource: lead.sourceRecords.some((s) => s.sourceType === "government_record"),
      governmentVerificationStatus: null,
    }));
  }

  const state = getLocalState();
  if (!state.pendingInternetLeads) state.pendingInternetLeads = [];
  return state.pendingInternetLeads.map(toPendingSummary);
}

export async function approveInternetLead(pendingId: string): Promise<{ leadId: string } | { error: string }> {
  const session = getSessionContext();

  if (isSupabaseMode()) {
    const ok = await approvePendingLeadSupabase(pendingId);
    if (!ok) return { error: "Could not approve lead." };
    appendPlatformAudit({
      eventType: "lead_approved",
      eventDescription: `Internet lead ${pendingId} approved`,
      relatedModule: "lead_discovery",
      relatedRecordId: pendingId,
      organizationId: session.organizationId,
    });
    return { leadId: pendingId };
  }

  const state = getLocalState();
  if (!state.pendingInternetLeads) state.pendingInternetLeads = [];
  const index = state.pendingInternetLeads.findIndex((p) => p.id === pendingId);
  if (index === -1) return { error: "Pending lead not found." };

  const pending = state.pendingInternetLeads[index];
  const lead = candidateToLocalLead(pending.candidate, session.organizationId);
  lead.id = pendingId.startsWith("pending-") ? `lead-${pendingId}` : pendingId;

  state.pendingInternetLeads = state.pendingInternetLeads.filter((p) => p.id !== pendingId);
  state.leads = [lead, ...state.leads];
  persistLocalState();

  await persistVerificationForCandidateAsync(lead.id, pending.candidate, pending.searchId);

  appendPlatformAudit({
    eventType: "lead_approved",
    eventDescription: `Internet lead approved: ${lead.propertyAddress}`,
    relatedModule: "lead_discovery",
    relatedRecordId: lead.id,
    organizationId: session.organizationId,
  });

  return { leadId: lead.id };
}

export async function rejectInternetLead(pendingId: string): Promise<{ ok: true } | { error: string }> {
  const session = getSessionContext();

  if (isSupabaseMode()) {
    const ok = await rejectPendingLeadSupabase(pendingId);
    if (!ok) return { error: "Could not reject lead." };
    appendPlatformAudit({
      eventType: "lead_rejected",
      eventDescription: `Internet lead ${pendingId} rejected`,
      relatedModule: "lead_discovery",
      relatedRecordId: pendingId,
      organizationId: session.organizationId,
    });
    return { ok: true };
  }

  const state = getLocalState();
  if (!state.pendingInternetLeads) state.pendingInternetLeads = [];
  const before = state.pendingInternetLeads.length;
  state.pendingInternetLeads = state.pendingInternetLeads.filter((p) => p.id !== pendingId);
  if (state.pendingInternetLeads.length === before) return { error: "Pending lead not found." };

  persistLocalState();
  appendPlatformAudit({
    eventType: "lead_rejected",
    eventDescription: `Internet lead rejected: ${pendingId}`,
    relatedModule: "lead_discovery",
    relatedRecordId: pendingId,
    organizationId: session.organizationId,
  });

  return { ok: true };
}

export function queuePendingLocally(
  candidates: LeadSearchCandidate[],
  searchId: string
): PendingInternetLead[] {
  const state = getLocalState();
  if (!state.pendingInternetLeads) state.pendingInternetLeads = [];

  const existingAddresses = [
    ...state.leads.map((l) => l.propertyAddress),
    ...state.pendingInternetLeads.map((p) => p.candidate.propertyAddress),
  ];

  const queued: PendingInternetLead[] = [];
  const now = new Date().toISOString();

  for (const candidate of candidates) {
    const normalized = candidate.propertyAddress.toLowerCase().replace(/\s+/g, " ");
    if (existingAddresses.some((a) => a.toLowerCase().replace(/\s+/g, " ") === normalized)) {
      continue;
    }
    const pending: PendingInternetLead = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      searchId,
      discoveredAt: now,
      status: "pending",
      candidate,
    };
    queued.push(pending);
    existingAddresses.push(candidate.propertyAddress);
  }

  if (queued.length > 0) {
    state.pendingInternetLeads = [...queued, ...state.pendingInternetLeads];
    persistLocalState();
  }

  return queued;
}

export { PENDING_INTERNET_NEXT_ACTION };
