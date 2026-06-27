import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { getSessionContext } from "@/lib/config/session";
import type { LeadSearchCandidate } from "@/lib/services/lead-discovery/types";
import type {
  ContactCandidate,
  PersonVerification,
  VerificationActionLog,
} from "@/lib/types/verification";
import { buildVerificationFromCandidate } from "./evidence-builder";
import { annotateCitations } from "./citation";
import { getEmptyVerificationState, type LocalVerificationState } from "./verification-state";

export type { LocalVerificationState } from "./verification-state";
export { getEmptyVerificationState } from "./verification-state";

export function ensureVerificationState(): LocalVerificationState {
  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    verification?: LocalVerificationState;
  };
  if (!state.verification) {
    state.verification = getEmptyVerificationState();
  }
  return state.verification;
}

export function persistVerificationForCandidateLocal(
  leadId: string,
  candidate: LeadSearchCandidate,
  searchId: string,
  organizationId?: string
): void {
  const orgId = organizationId ?? getSessionContext().organizationId;
  const built = buildVerificationFromCandidate(leadId, orgId, candidate, searchId);
  const v = ensureVerificationState();

  v.recordHits = v.recordHits.filter((r) => r.leadId !== leadId).concat(built.recordHit);
  v.evidenceSources = v.evidenceSources.filter((e) => e.leadId !== leadId).concat(built.evidenceSources);
  v.persons = v.persons.filter((p) => p.leadId !== leadId).concat(built.persons);
  v.contactCandidates = v.contactCandidates
    .filter((c) => c.leadId !== leadId)
    .concat(built.contactCandidates);
  v.propertyMedia = v.propertyMedia.filter((m) => m.leadId !== leadId).concat(built.propertyMedia);

  persistLocalState();
}

function filterByLead<T extends { leadId: string }>(items: T[], leadId: string): T[] {
  return items.filter((i) => i.leadId === leadId);
}

export function getLeadVerificationBundleLocal(
  leadId: string,
  meta?: { propertyAddress: string; ownerName?: string | null; parcelId?: string | null }
) {
  const v = ensureVerificationState();
  return {
    recordHits: filterByLead(v.recordHits, leadId),
    evidenceSources: annotateCitations(filterByLead(v.evidenceSources, leadId)),
    persons: filterByLead(v.persons, leadId),
    contactCandidates: filterByLead(v.contactCandidates, leadId),
    propertyMedia: filterByLead(v.propertyMedia, leadId),
    actionLogs: filterByLead(v.actionLogs, leadId),
    meta,
  };
}

export function updatePersonVerificationLocal(
  leadId: string,
  personId: string,
  action: "approve" | "reject" | "needs_research",
  log: Omit<VerificationActionLog, "id" | "createdAt">
): PersonVerification | null {
  const v = ensureVerificationState();
  const person = v.persons.find((p) => p.id === personId && p.leadId === leadId);
  if (!person) return null;

  const now = new Date().toISOString();
  if (action === "approve") {
    person.verificationStatus = "manually_approved";
    person.roleLabel = "manually_approved";
    person.approvedAt = now;
    person.approvedBy = log.actorUserId ?? null;
  } else if (action === "reject") {
    person.verificationStatus = "rejected";
    person.rejectedAt = now;
  } else {
    person.verificationStatus = "needs_research";
  }
  person.updatedAt = now;
  if (log.notes) person.notes = log.notes;

  v.actionLogs.unshift({
    ...log,
    id: `val-${Date.now()}`,
    createdAt: now,
  });
  persistLocalState();
  return person;
}

export function updateContactCandidateLocal(
  leadId: string,
  contactId: string,
  action: "approve" | "reject" | "needs_research",
  log: Omit<VerificationActionLog, "id" | "createdAt">
): ContactCandidate | null {
  const v = ensureVerificationState();
  const contact = v.contactCandidates.find((c) => c.id === contactId && c.leadId === leadId);
  if (!contact) return null;

  const now = new Date().toISOString();
  if (action === "approve") {
    contact.verificationStatus = "verified";
    contact.lastVerifiedAt = now;
  } else if (action === "reject") {
    contact.verificationStatus = "rejected";
  } else {
    contact.verificationStatus = "unverified";
    contact.notes = `${contact.notes ?? ""} Marked needs research.`.trim();
  }

  v.actionLogs.unshift({
    ...log,
    id: `val-${Date.now()}`,
    createdAt: now,
  });
  persistLocalState();
  return contact;
}
