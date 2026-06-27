import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import type {
  AttorneyCompensation,
  AttorneyReview,
  AttorneyReviewUpload,
  DistributionAuditLog,
  DistributionPacket,
  EmailDistribution,
  ExternalRecipient,
} from "@/lib/types/distribution";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

type DistributionState = ReturnType<typeof getLocalState> & {
  attorneyReviews?: AttorneyReview[];
  attorneyCompensation?: AttorneyCompensation[];
  distributionPackets?: DistributionPacket[];
  emailDistributions?: EmailDistribution[];
  externalRecipients?: ExternalRecipient[];
  distributionAuditLogs?: DistributionAuditLog[];
};

function ensureDistributionState(): DistributionState {
  const state = getLocalState() as DistributionState;
  if (!state.attorneyReviews) state.attorneyReviews = [];
  if (!state.attorneyCompensation) state.attorneyCompensation = [];
  if (!state.distributionPackets) state.distributionPackets = [];
  if (!state.emailDistributions) state.emailDistributions = [];
  if (!state.externalRecipients) state.externalRecipients = [];
  if (!state.distributionAuditLogs) state.distributionAuditLogs = [];
  return state;
}

export function logDistributionAudit(
  entry: Omit<DistributionAuditLog, "id" | "createdAt" | "organizationId" | "performedBy">
): DistributionAuditLog {
  const session = getSessionContext();
  const state = ensureDistributionState();
  const row: DistributionAuditLog = {
    ...entry,
    id: uid("dal"),
    organizationId: session.organizationId,
    performedBy: session.userName,
    createdAt: now(),
  };
  state.distributionAuditLogs!.unshift(row);
  if (state.distributionAuditLogs!.length > 2000) state.distributionAuditLogs!.length = 2000;
  persistLocalState();
  return row;
}

export function getAttorneyReview(leadId: string): AttorneyReview | null {
  return (ensureDistributionState().attorneyReviews ?? []).find((r) => r.leadId === leadId) ?? null;
}

export function saveAttorneyReview(review: AttorneyReview): AttorneyReview {
  const state = ensureDistributionState();
  const idx = state.attorneyReviews!.findIndex((r) => r.leadId === review.leadId);
  if (idx === -1) state.attorneyReviews!.unshift(review);
  else state.attorneyReviews![idx] = { ...review, updatedAt: now() };
  persistLocalState();
  return review;
}

export function createAttorneyReview(leadId: string, packetId?: string): AttorneyReview {
  const session = getSessionContext();
  const existing = getAttorneyReview(leadId);
  if (existing) return existing;
  const review: AttorneyReview = {
    id: uid("ar"),
    organizationId: session.organizationId,
    leadId,
    packetId: packetId ?? null,
    reviewStatus: "not_started",
    attorneyFeeStatus: "not_discussed",
    uploads: [],
    createdAt: now(),
    updatedAt: now(),
  };
  return saveAttorneyReview(review);
}

export function addAttorneyUpload(
  leadId: string,
  upload: Omit<AttorneyReviewUpload, "id" | "uploadedAt" | "organizationId" | "uploadedBy" | "versionNumber">
): AttorneyReviewUpload {
  const session = getSessionContext();
  const review = getAttorneyReview(leadId) ?? createAttorneyReview(leadId);
  const sameCategory = review.uploads.filter((u) => u.documentCategory === upload.documentCategory);
  const versionNumber = sameCategory.length > 0 ? Math.max(...sameCategory.map((u) => u.versionNumber)) + 1 : 1;
  const row: AttorneyReviewUpload = {
    ...upload,
    id: uid("aru"),
    organizationId: session.organizationId,
    uploadedBy: session.userName,
    uploadedAt: now(),
    versionNumber,
  };
  review.uploads.unshift(row);
  saveAttorneyReview({ ...review, updatedAt: now() });
  return row;
}

export function getAttorneyCompensation(leadId: string): AttorneyCompensation | null {
  return (ensureDistributionState().attorneyCompensation ?? []).find((c) => c.leadId === leadId) ?? null;
}

export function saveAttorneyCompensation(comp: AttorneyCompensation): AttorneyCompensation {
  const state = ensureDistributionState();
  const idx = state.attorneyCompensation!.findIndex((c) => c.leadId === comp.leadId);
  if (idx === -1) state.attorneyCompensation!.unshift(comp);
  else state.attorneyCompensation![idx] = { ...comp, updatedAt: now() };
  persistLocalState();
  return comp;
}

export function getDistributionPackets(filters?: { leadId?: string }): DistributionPacket[] {
  let items = ensureDistributionState().distributionPackets ?? [];
  if (filters?.leadId) items = items.filter((p) => p.leadId === filters.leadId);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDistributionPacket(id: string): DistributionPacket | null {
  return getDistributionPackets().find((p) => p.id === id) ?? null;
}

export function saveDistributionPacket(packet: DistributionPacket): DistributionPacket {
  const state = ensureDistributionState();
  const idx = state.distributionPackets!.findIndex((p) => p.id === packet.id);
  if (idx === -1) state.distributionPackets!.unshift(packet);
  else state.distributionPackets![idx] = { ...packet, updatedAt: now() };
  persistLocalState();
  return packet;
}

export function getEmailDistributions(filters?: { leadId?: string }): EmailDistribution[] {
  let items = ensureDistributionState().emailDistributions ?? [];
  if (filters?.leadId) items = items.filter((e) => e.leadId === filters.leadId);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveEmailDistribution(row: EmailDistribution): EmailDistribution {
  const state = ensureDistributionState();
  const idx = state.emailDistributions!.findIndex((e) => e.id === row.id);
  if (idx === -1) state.emailDistributions!.unshift(row);
  else state.emailDistributions![idx] = { ...row, updatedAt: now() };
  persistLocalState();
  return row;
}

export function getExternalRecipients(): ExternalRecipient[] {
  return ensureDistributionState().externalRecipients ?? [];
}

export function saveExternalRecipient(recipient: ExternalRecipient): ExternalRecipient {
  const state = ensureDistributionState();
  const idx = state.externalRecipients!.findIndex((r) => r.id === recipient.id);
  if (idx === -1) state.externalRecipients!.unshift(recipient);
  else state.externalRecipients![idx] = { ...recipient, updatedAt: now() };
  persistLocalState();
  return recipient;
}

export function getDistributionAuditLogs(leadId?: string): DistributionAuditLog[] {
  const logs = ensureDistributionState().distributionAuditLogs ?? [];
  return leadId ? logs.filter((l) => l.leadId === leadId) : logs;
}

export function seedExternalRecipientsFromBuyers(): ExternalRecipient[] {
  const state = ensureDistributionState();
  if (state.externalRecipients!.length > 0) return state.externalRecipients!;
  const session = getSessionContext();
  for (const buyer of state.buyers ?? []) {
    state.externalRecipients!.push({
      id: uid("er"),
      organizationId: session.organizationId,
      name: buyer.buyerName,
      company: buyer.company,
      email: buyer.email ?? "",
      phone: buyer.phone,
      recipientType: buyer.cashBuyer ? "cash_buyer" : "investor",
      marketArea: buyer.preferredStates?.join(", "),
      buyerCriteria: buyer.buyBoxNotes,
      proofOfFundsStatus: buyer.proofOfFundsStatus ?? "unknown",
      contactPermissionStatus: "unknown",
      lastContactedAt: buyer.lastContacted,
      packetSentCount: 0,
      responseStatus: "not_contacted",
      notes: buyer.notes,
      doNotContact: false,
      createdAt: now(),
      updatedAt: now(),
    });
  }
  persistLocalState();
  return state.externalRecipients!;
}
