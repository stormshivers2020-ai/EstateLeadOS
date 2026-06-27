import { getSessionContext } from "@/lib/config/session";
import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import type {
  AssignmentReadiness,
  LeadArchive,
  LeadPacket,
  PacketPrintLog,
  RequiredDocument,
  ReviewQueueItem,
} from "@/lib/types/program";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

type ProgramState = ReturnType<typeof getLocalState> & {
  programPackets?: LeadPacket[];
  leadArchives?: LeadArchive[];
  requiredDocuments?: RequiredDocument[];
  assignmentReadiness?: AssignmentReadiness[];
  reviewQueueItems?: ReviewQueueItem[];
  packetPrintLogs?: PacketPrintLog[];
};

function ensureProgramState(): ProgramState {
  const state = getLocalState() as ProgramState;
  if (!state.programPackets) state.programPackets = [];
  if (!state.leadArchives) state.leadArchives = [];
  if (!state.requiredDocuments) state.requiredDocuments = [];
  if (!state.assignmentReadiness) state.assignmentReadiness = [];
  if (!state.reviewQueueItems) state.reviewQueueItems = [];
  if (!state.packetPrintLogs) state.packetPrintLogs = [];
  return state;
}

export function getProgramPackets(filters?: { leadId?: string; packetType?: string }): LeadPacket[] {
  let items = ensureProgramState().programPackets ?? [];
  if (filters?.leadId) items = items.filter((p) => p.leadId === filters.leadId);
  if (filters?.packetType) items = items.filter((p) => p.packetType === filters.packetType);
  return items.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function getProgramPacket(id: string): LeadPacket | null {
  return getProgramPackets().find((p) => p.id === id) ?? null;
}

export function saveProgramPacket(packet: LeadPacket): LeadPacket {
  const state = ensureProgramState();
  const idx = state.programPackets!.findIndex((p) => p.id === packet.id);
  if (idx === -1) state.programPackets!.unshift(packet);
  else state.programPackets![idx] = { ...packet, updatedAt: now() };
  persistLocalState();
  return packet;
}

export function getNextPacketVersion(leadId: string, packetType: string): number {
  const existing = getProgramPackets({ leadId, packetType });
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((p) => p.packetVersion)) + 1;
}

export function getLeadArchives(filters?: { leadId?: string; archiveStatus?: string }): LeadArchive[] {
  let items = ensureProgramState().leadArchives ?? [];
  if (filters?.leadId) items = items.filter((a) => a.leadId === filters.leadId);
  if (filters?.archiveStatus) items = items.filter((a) => a.archiveStatus === filters.archiveStatus);
  return items.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
}

export function saveLeadArchive(archive: LeadArchive): LeadArchive {
  const state = ensureProgramState();
  state.leadArchives!.unshift(archive);
  persistLocalState();
  return archive;
}

export function updateLeadArchive(id: string, patch: Partial<LeadArchive>): LeadArchive | null {
  const state = ensureProgramState();
  const idx = state.leadArchives!.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  state.leadArchives![idx] = { ...state.leadArchives![idx], ...patch, updatedAt: now() };
  persistLocalState();
  return state.leadArchives![idx];
}

export function getRequiredDocuments(leadId: string): RequiredDocument[] {
  return (ensureProgramState().requiredDocuments ?? []).filter((d) => d.leadId === leadId);
}

export function saveRequiredDocuments(docs: RequiredDocument[]): RequiredDocument[] {
  const state = ensureProgramState();
  for (const doc of docs) {
    const idx = state.requiredDocuments!.findIndex((d) => d.id === doc.id);
    if (idx === -1) state.requiredDocuments!.push(doc);
    else state.requiredDocuments![idx] = doc;
  }
  persistLocalState();
  return docs;
}

export function getAssignmentReadiness(leadId: string): AssignmentReadiness | null {
  return (ensureProgramState().assignmentReadiness ?? []).find((a) => a.leadId === leadId) ?? null;
}

export function saveAssignmentReadiness(record: AssignmentReadiness): AssignmentReadiness {
  const state = ensureProgramState();
  const idx = state.assignmentReadiness!.findIndex((a) => a.leadId === record.leadId);
  if (idx === -1) state.assignmentReadiness!.unshift(record);
  else state.assignmentReadiness![idx] = { ...record, updatedAt: now() };
  persistLocalState();
  return record;
}

export function getReviewQueueItems(filters?: { queueType?: string }): ReviewQueueItem[] {
  let items = ensureProgramState().reviewQueueItems ?? [];
  if (filters?.queueType) items = items.filter((i) => i.queueType === filters.queueType);
  return items.sort((a, b) => a.priority - b.priority || b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertReviewQueueItem(item: ReviewQueueItem): ReviewQueueItem {
  const state = ensureProgramState();
  const idx = state.reviewQueueItems!.findIndex(
    (i) => i.leadId === item.leadId && i.queueType === item.queueType
  );
  if (idx === -1) state.reviewQueueItems!.unshift(item);
  else state.reviewQueueItems![idx] = { ...item, updatedAt: now() };
  persistLocalState();
  return item;
}

export function removeReviewQueueItem(id: string): void {
  const state = ensureProgramState();
  state.reviewQueueItems = state.reviewQueueItems!.filter((i) => i.id !== id);
  persistLocalState();
}

export function logPacketPrint(log: Omit<PacketPrintLog, "id" | "printedAt">): PacketPrintLog {
  const state = ensureProgramState();
  const row: PacketPrintLog = { ...log, id: uid("ppl"), printedAt: now() };
  state.packetPrintLogs!.unshift(row);
  persistLocalState();
  return row;
}

export function createEmptyAssignmentReadiness(leadId: string): AssignmentReadiness {
  const session = getSessionContext();
  return {
    id: uid("ar"),
    organizationId: session.organizationId,
    leadId,
    status: "not_started",
    buyerProofOfFundsStatus: "not_checked",
    titleCompanyStatus: "not_entered",
    disclosureChecklistStatus: "not_reviewed",
    attorneyReviewStatus: "not_reviewed",
    signedDocumentStatus: "not_started",
    complianceBlockersClear: false,
    payoutReadinessStatus: "not_started",
    checklist: ASSIGNMENT_CHECKLIST_TEMPLATE.map((c) => ({ ...c, complete: false })),
    createdAt: now(),
    updatedAt: now(),
  };
}

export const ASSIGNMENT_CHECKLIST_TEMPLATE = [
  { id: "gov_verified", label: "Lead verified through government proof chain", required: true },
  { id: "manual_approval", label: "Manual approval completed", required: true },
  { id: "outreach_approved", label: "Seller outreach approved", required: true },
  { id: "contact_log", label: "Contact log started", required: false },
  { id: "disclosures", label: "Required disclosures checklist reviewed", required: true },
  { id: "attorney_reminder", label: "Attorney/title review reminder acknowledged", required: true },
  { id: "purchase_placeholder", label: "Purchase/intent document placeholder prepared", required: false },
  { id: "buyer_match", label: "Buyer match found", required: false },
  { id: "pof", label: "Buyer proof-of-funds status checked", required: false },
  { id: "assignment_disclosure", label: "Assignment disclosure checklist reviewed", required: true },
  { id: "title_company", label: "Title company status entered", required: false },
  { id: "signed_docs", label: "Signed document status tracked", required: false },
  { id: "deal_calc", label: "Deal calculator estimate attached", required: false },
  { id: "min_spread", label: "Minimum acceptable spread entered", required: false },
  { id: "fee_target", label: "Assignment fee target entered", required: false },
  { id: "compliance_clear", label: "Compliance blockers cleared", required: true },
];
