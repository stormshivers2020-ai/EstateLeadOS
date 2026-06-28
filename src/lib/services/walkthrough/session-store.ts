import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { DEMO_FULL_LEADS } from "@/lib/seed/demo-crm";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { saveToInitialReviewArchive } from "@/lib/services/program/archive-hub";
import { buildLeadPacket } from "@/lib/services/program/packet-builder";
import { appendCrmAudit } from "@/lib/local/localAudit";
import type { FullLeadDetail } from "@/lib/types/crm";
import type {
  LeadWalkthroughSession,
  WalkthroughStepData,
  WalkthroughStepId,
} from "@/lib/types/walkthrough";
import { WALKTHROUGH_STEP_ORDER } from "@/lib/types/walkthrough";
import { advanceSession, calculateLeadScore } from "./engine";

function uid(): string {
  return `wt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function getWalkthroughSessions(): LeadWalkthroughSession[] {
  return getLocalState().walkthroughSessions ?? [];
}

export function getActiveWalkthroughSession(): LeadWalkthroughSession | null {
  return getWalkthroughSessions().find((s) => s.status === "active" || s.status === "draft") ?? null;
}

export function getWalkthroughSessionById(id: string): LeadWalkthroughSession | null {
  return getWalkthroughSessions().find((s) => s.id === id) ?? null;
}

function saveSessions(sessions: LeadWalkthroughSession[]): void {
  const state = getLocalState();
  state.walkthroughSessions = sessions;
  persistLocalState();
}

export function createWalkthroughSession(): LeadWalkthroughSession {
  const session = getSessionContext();
  const existing = getActiveWalkthroughSession();
  if (existing) return existing;

  const created: LeadWalkthroughSession = {
    id: uid(),
    organizationId: session.organizationId,
    leadId: null,
    currentStep: "start",
    completedSteps: [],
    stepData: {},
    status: "active",
    locked: true,
    finalOutcome: null,
    createdAt: now(),
    updatedAt: now(),
  };

  saveSessions([...getWalkthroughSessions(), created]);
  return created;
}

export function updateWalkthroughSession(
  sessionId: string,
  patch: Partial<Pick<LeadWalkthroughSession, "currentStep" | "stepData" | "leadId" | "status" | "completedSteps" | "finalOutcome">>
): LeadWalkthroughSession | null {
  const sessions = getWalkthroughSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) return null;

  const updated: LeadWalkthroughSession = {
    ...sessions[idx],
    ...patch,
    stepData: patch.stepData ? { ...sessions[idx].stepData, ...patch.stepData } : sessions[idx].stepData,
    updatedAt: now(),
  };
  sessions[idx] = updated;
  saveSessions(sessions);
  return updated;
}

export function saveWalkthroughDraft(sessionId: string, stepData: WalkthroughStepData): LeadWalkthroughSession | null {
  return updateWalkthroughSession(sessionId, { stepData, status: "draft" });
}

export function createWalkthroughLead(input: {
  estateName: string;
  county: string;
  state: string;
}): FullLeadDetail {
  const session = getSessionContext();
  const template = DEMO_FULL_LEADS[0];
  const lead: FullLeadDetail = {
    ...template,
    id: `lead-wt-${Date.now()}`,
    organizationId: session.organizationId,
    propertyAddress: `${input.estateName} — address pending`,
    street: "",
    city: "",
    state: input.state,
    county: input.county,
    ownerName: input.estateName,
    primaryLeadType: "needs_manual_review",
    pipelineStage: "researching",
    estateLeadScore: 0,
    dealPotentialScore: 0,
    dataConfidenceScore: 0,
    origin: "manually_added",
    nextAction: "Complete First Lead Walkthrough",
    demoRecord: false,
    walkthroughStatus: "WALKTHROUGH_ACTIVE",
    createdAt: now(),
    updatedAt: now(),
  };

  const state = getLocalState();
  state.leads = [lead, ...state.leads];
  persistLocalState();
  appendCrmAudit({
    leadId: lead.id,
    eventType: "walkthrough_lead_created",
    description: `First Lead Walkthrough lead: ${input.estateName}`,
  });
  return lead;
}

export function bindWalkthroughLead(sessionId: string, leadId: string, startData: WalkthroughStepData["start"]): LeadWalkthroughSession | null {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return null;

  const state = getLocalState();
  const leadIdx = state.leads.findIndex((l) => l.id === leadId);
  if (leadIdx >= 0) {
    state.leads[leadIdx] = {
      ...state.leads[leadIdx],
      walkthroughStatus: "WALKTHROUGH_ACTIVE",
      ownerName: startData?.estateName ?? state.leads[leadIdx].ownerName,
      county: startData?.county ?? state.leads[leadIdx].county,
      state: startData?.state ?? state.leads[leadIdx].state,
      updatedAt: now(),
    };
    persistLocalState();
  }

  return updateWalkthroughSession(sessionId, {
    leadId,
    stepData: { start: startData },
  });
}

export async function generateWalkthroughPacket(sessionId: string): Promise<LeadWalkthroughSession | null> {
  const session = getWalkthroughSessionById(sessionId);
  if (!session?.leadId) return null;

  const packet = await buildLeadPacket({
    leadId: session.leadId,
    packetType: "acquisition_preparation",
    saveAsDraft: false,
  });

  return updateWalkthroughSession(sessionId, {
    stepData: {
      packet_builder: {
        packetId: packet.id,
        reviewed: false,
        status: "draft",
      },
    },
  });
}

export function markPacketReviewed(sessionId: string): LeadWalkthroughSession | null {
  const session = getWalkthroughSessionById(sessionId);
  if (!session) return null;
  return updateWalkthroughSession(sessionId, {
    stepData: {
      packet_builder: {
        ...session.stepData.packet_builder,
        packetId: session.stepData.packet_builder?.packetId,
        reviewed: true,
        status: "review_ready",
      },
    },
  });
}

export function createWalkthroughArchive(sessionId: string): LeadWalkthroughSession | null {
  const session = getWalkthroughSessionById(sessionId);
  if (!session?.leadId) return null;

  const packetId = session.stepData.packet_builder?.packetId;
  if (!packetId) return null;

  const archive = saveToInitialReviewArchive(packetId, "First Lead Walkthrough — final archive");

  const state = getLocalState();
  const leadIdx = state.leads.findIndex((l) => l.id === session.leadId);
  if (leadIdx >= 0) {
    const decision = session.stepData.lead_qualification?.decision;
    state.leads[leadIdx] = {
      ...state.leads[leadIdx],
      walkthroughStatus: "WALKTHROUGH_COMPLETE",
      pipelineStage: decision === "reject" ? "dead_lead" : decision === "hold" ? "needs_research" : "compliance_review",
      estateLeadScore: session.stepData.lead_qualification?.score ?? state.leads[leadIdx].estateLeadScore,
      nextAction: session.stepData.outreach_direction?.nextAction ?? "Walkthrough complete",
      updatedAt: now(),
    };
    persistLocalState();
  }

  return updateWalkthroughSession(sessionId, {
    stepData: {
      final_archive: {
        archiveId: archive.id,
        archiveLocation: `/archive?tab=initial_review&lead=${session.leadId}`,
      },
    },
    status: "complete",
    finalOutcome: session.stepData.lead_qualification?.decision ?? "archived",
    currentStep: "complete",
    completedSteps: WALKTHROUGH_STEP_ORDER.filter((s) => s !== "complete"),
  });
}

export function continueWalkthrough(sessionId: string): LeadWalkthroughSession | null {
  const session = getWalkthroughSessionById(sessionId);
  if (!session) return null;

  const score = calculateLeadScore(session.stepData);
  let stepData = session.stepData;
  if (session.currentStep === "lead_qualification" && stepData.lead_qualification) {
    stepData = {
      ...stepData,
      lead_qualification: { ...stepData.lead_qualification, score },
    };
  }

  if (session.currentStep === "outreach_direction" && session.leadId && stepData.outreach_direction) {
    const ctx = getSessionContext();
    const lead = getFullLeadByIdSync(session.leadId);
    const due = stepData.outreach_direction.dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const state = getLocalState();
    state.followUps = [
      {
        id: `fu-wt-${Date.now()}`,
        leadId: session.leadId,
        organizationId: session.organizationId,
        assignedUserId: ctx.userId,
        assignedUserName: ctx.userName,
        propertyAddress: lead?.propertyAddress ?? "",
        followUpDate: due.slice(0, 10),
        followUpTime: null,
        followUpMethod: "internal_note",
        reason: `Walkthrough: ${stepData.outreach_direction.nextAction.replace(/_/g, " ")}`,
        priority: "normal",
        status: "scheduled",
        relatedCommunicationId: null,
        notes: stepData.outreach_direction.taskNotes,
        createdAt: now(),
        completedAt: null,
      },
      ...state.followUps,
    ];
    persistLocalState();
  }

  const withScore = { ...session, stepData };
  const advanced = advanceSession(withScore);
  if (advanced.currentStep === session.currentStep) return null;

  return updateWalkthroughSession(sessionId, {
    currentStep: advanced.currentStep,
    completedSteps: advanced.completedSteps,
    stepData: advanced.stepData,
    status: advanced.status,
    finalOutcome: advanced.finalOutcome,
  });
}

export function goToWalkthroughStep(sessionId: string, step: WalkthroughStepId): LeadWalkthroughSession | null {
  const session = getWalkthroughSessionById(sessionId);
  if (!session) return null;
  const stepIdx = WALKTHROUGH_STEP_ORDER.indexOf(step);
  const currentIdx = WALKTHROUGH_STEP_ORDER.indexOf(session.currentStep);
  if (stepIdx > currentIdx) return null;
  return updateWalkthroughSession(sessionId, { currentStep: step });
}
