import "server-only";

import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import type { LeadSearchCandidate } from "@/lib/services/lead-discovery/types";
import type {
  ContactCandidate,
  LeadVerificationBundle,
  PersonVerification,
} from "@/lib/types/verification";
import { evaluateGovernmentVerification } from "@/lib/services/government/verification-engine";
import { assembleVerificationBundle } from "./proof-chain";
import {
  getLeadVerificationBundleLocal,
  persistVerificationForCandidateLocal,
  updateContactCandidateLocal,
  updatePersonVerificationLocal,
} from "./local-store";
import * as supabaseVerification from "@/lib/supabase/queries/verification";

export {
  getEmptyVerificationState,
  type LocalVerificationState,
} from "./verification-state";

export async function persistVerificationForCandidateAsync(
  leadId: string,
  candidate: LeadSearchCandidate,
  searchId: string
): Promise<void> {
  if (isSupabaseMode()) {
    await supabaseVerification.saveVerificationFromCandidate(leadId, candidate, searchId);
    return;
  }
  persistVerificationForCandidateLocal(leadId, candidate, searchId);
}

export async function getLeadVerificationBundle(
  leadId: string,
  meta?: { propertyAddress: string; ownerName?: string | null; parcelId?: string | null }
): Promise<LeadVerificationBundle | null> {
  if (isSupabaseMode()) {
    const bundle = await supabaseVerification.fetchVerificationBundle(leadId, meta);
    return bundle ? enrichBundle(bundle) : null;
  }

  const local = getLeadVerificationBundleLocal(leadId, meta);
  if (
    !meta &&
    local.recordHits.length === 0 &&
    local.persons.length === 0
  ) {
    return null;
  }

  return enrichBundle(
    assembleVerificationBundle(leadId, {
      propertyAddress: meta?.propertyAddress ?? "",
      ownerName: meta?.ownerName,
      parcelId: meta?.parcelId,
      recordHits: local.recordHits,
      evidenceSources: local.evidenceSources,
      persons: local.persons,
      contactCandidates: local.contactCandidates,
      propertyMedia: local.propertyMedia,
      actionLogs: local.actionLogs,
    })
  );
}

function enrichBundle(bundle: LeadVerificationBundle): LeadVerificationBundle {
  const governmentEvaluation = evaluateGovernmentVerification(bundle);
  return {
    ...bundle,
    governmentStatus: governmentEvaluation.status,
    governmentEvaluation,
  };
}

export async function updatePersonVerification(
  leadId: string,
  personId: string,
  action: "approve" | "reject" | "needs_research",
  options: { notes?: string; contactMethod?: string; sourceEvidenceId?: string }
): Promise<PersonVerification | null> {
  const session = getSessionContext();
  const logBase = {
    organizationId: session.organizationId,
    leadId,
    actorUserId: session.userId,
    actorUserName: session.userName,
    actionType: `person_${action}`,
    targetType: "person" as const,
    targetId: personId,
    sourceEvidenceId: options.sourceEvidenceId ?? null,
    contactMethod: options.contactMethod ?? null,
    notes: options.notes ?? null,
  };

  if (isSupabaseMode()) {
    return supabaseVerification.updatePersonVerification(leadId, personId, action, logBase);
  }
  return updatePersonVerificationLocal(leadId, personId, action, logBase);
}

export async function updateContactCandidate(
  leadId: string,
  contactId: string,
  action: "approve" | "reject" | "needs_research",
  options: { notes?: string; sourceEvidenceId?: string }
): Promise<ContactCandidate | null> {
  const session = getSessionContext();
  const logBase = {
    organizationId: session.organizationId,
    leadId,
    actorUserId: session.userId,
    actorUserName: session.userName,
    actionType: `contact_${action}`,
    targetType: "contact" as const,
    targetId: contactId,
    sourceEvidenceId: options.sourceEvidenceId ?? null,
    contactMethod: null,
    notes: options.notes ?? null,
  };

  if (isSupabaseMode()) {
    return supabaseVerification.updateContactCandidate(leadId, contactId, action, logBase);
  }
  return updateContactCandidateLocal(leadId, contactId, action, logBase);
}

export async function updateLeadGovernmentVerification(
  leadId: string,
  action: "approve" | "reject" | "needs_research",
  options?: { notes?: string }
): Promise<LeadVerificationBundle | null> {
  const session = getSessionContext();
  const bundle = await getLeadVerificationBundle(leadId);
  if (!bundle) return null;

  let status = bundle.governmentStatus ?? "unverified";
  if (action === "approve") {
    const evaluation = evaluateGovernmentVerification(bundle, true);
    status = evaluation.canVerify ? "verified_government_lead" : "needs_manual_research";
  } else if (action === "reject") {
    status = "rejected_bad_match";
  } else {
    status = "needs_manual_research";
  }

  if (isSupabaseMode()) {
    const { updateLeadGovernmentStatus } = await import("@/lib/supabase/queries/government");
    await updateLeadGovernmentStatus(leadId, status);
  } else {
    const state = (await import("@/lib/local/localStateStore")).getLocalState() as ReturnType<
      typeof import("@/lib/local/localStateStore").getLocalState
    > & { leadGovernmentStatus?: Record<string, string> };
    if (!state.leadGovernmentStatus) state.leadGovernmentStatus = {};
    state.leadGovernmentStatus[leadId] = status;
    (await import("@/lib/local/localStateStore")).persistLocalState();
  }

  const logBase = {
    organizationId: session.organizationId,
    leadId,
    actorUserId: session.userId,
    actorUserName: session.userName,
    actionType: `lead_${action}`,
    targetType: "lead" as const,
    targetId: leadId,
    sourceEvidenceId: null,
    contactMethod: null,
    notes: options?.notes ?? null,
  };

  if (isSupabaseMode()) {
    await supabaseVerification.insertActionLog(logBase);
  } else {
    const { ensureVerificationState } = await import("./local-store");
    const v = ensureVerificationState();
    v.actionLogs.unshift({
      ...logBase,
      id: `val-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    (await import("@/lib/local/localStateStore")).persistLocalState();
  }

  return getLeadVerificationBundle(leadId);
}
