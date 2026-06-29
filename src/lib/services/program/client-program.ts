import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import type { ArchiveTabId, DraftSignatureDocument, LeadArchive, LeadPacket, LeadPacketType } from "@/lib/types/program";
import {
  archivePacket,
  getArchiveOverview,
  recordPacketPrint,
  saveToInitialReviewArchive,
  lockArchiveVersion,
  markArchiveRejected,
  markArchiveSuperseded,
} from "./archive";
import { getArchiveHubData, type ArchiveHubData } from "./archive-hub";
import { buildLeadPacket, generatePdfPlaceholderUrl } from "./packet-builder";
import { runDocumentFinder } from "./document-finder";
import {
  getDraftSignatureDocuments,
  getLeadArchives,
  getProgramPacket,
  getProgramPackets,
  updateProgramPacket,
} from "./local-store";
import { buildAttorneyReviewFileClient } from "@/lib/services/distribution/client-attorney-review";

export interface ArchiveOverviewData {
  total: number;
  readyForReview: number;
  missingDocuments: number;
  archives: LeadArchive[];
  packets: LeadPacket[];
  initialReviewCount?: number;
  finalReviewCount?: number;
  hub?: ArchiveHubData;
}

export type { ArchiveHubData };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? "Request failed");
  }
  return json as T;
}

export async function loadArchiveHub(tab: ArchiveTabId = "all"): Promise<ArchiveHubData> {
  if (isLocalPreviewMode()) {
    return getArchiveHubData(tab);
  }
  return fetchJson<ArchiveHubData>(`/api/archive?tab=${encodeURIComponent(tab)}`);
}

export async function archiveHubAction(
  action: string,
  payload: Record<string, string>
): Promise<{ error?: string; message?: string }> {
  if (isLocalPreviewMode()) {
    try {
      switch (action) {
        case "initial_archive":
          saveToInitialReviewArchive(payload.packetId, payload.notes);
          return { message: "Saved to Initial Review Archive." };
        case "lock":
          lockArchiveVersion(payload.archiveId);
          return { message: "Archive version locked." };
        case "supersede":
          markArchiveSuperseded(payload.archiveId, payload.supersededBy);
          return { message: "Marked superseded — prior version preserved." };
        case "reject":
          markArchiveRejected(payload.archiveId);
          return { message: "Marked rejected." };
        default:
          return { error: "Invalid action" };
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Action failed" };
    }
  }
  return fetchJson("/api/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
}

export async function loadArchiveOverview(): Promise<ArchiveOverviewData> {
  if (isLocalPreviewMode()) {
    return getArchiveOverview();
  }
  return fetchJson<ArchiveOverviewData>("/api/archive");
}

export async function loadLeadArchiveData(leadId: string): Promise<{
  packets: LeadPacket[];
  archives: LeadArchive[];
}> {
  if (isLocalPreviewMode()) {
    return {
      packets: getProgramPackets({ leadId }),
      archives: getLeadArchives({ leadId }),
    };
  }
  return fetchJson(`/api/archive?leadId=${encodeURIComponent(leadId)}`);
}

export function resolvePacketById(packetId: string): LeadPacket | null {
  if (isLocalPreviewMode()) {
    return getProgramPacket(packetId);
  }
  return null;
}

export async function fetchPacketById(packetId: string): Promise<LeadPacket | null> {
  if (isLocalPreviewMode()) {
    return getProgramPacket(packetId);
  }
  const json = await fetchJson<{ packet?: LeadPacket }>(`/api/archive?packetId=${encodeURIComponent(packetId)}`);
  return json.packet ?? null;
}

export async function printPacketAction(
  packetId: string,
  leadId: string
): Promise<{ printableHtml?: string; error?: string }> {
  if (isLocalPreviewMode()) {
    const packet = getProgramPacket(packetId);
    if (!packet?.printableHtml) {
      return { error: "Packet not found. Build a packet from Lead Detail first." };
    }
    recordPacketPrint(packetId, leadId);
    return { printableHtml: packet.printableHtml };
  }

  const json = await fetchJson<{ printableHtml?: string; error?: string }>(`/api/packets/actions/${packetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "print" }),
  });
  return json;
}

export async function archivePacketAction(
  packetId: string
): Promise<{ archive?: LeadArchive; error?: string }> {
  if (isLocalPreviewMode()) {
    const packet = getProgramPacket(packetId);
    if (!packet) return { error: "Packet not found." };
    return { archive: archivePacket(packet) };
  }

  const json = await fetchJson<{ archive?: LeadArchive; error?: string }>(`/api/packets/actions/${packetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "archive" }),
  });
  return json;
}

export async function buildPacketAction(
  leadId: string,
  packetType: LeadPacketType
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isLocalPreviewMode()) {
    try {
      const packet = await buildLeadPacket({ leadId, packetType });
      return {
        success: true,
        message: `Packet v${packet.packetVersion} built (${packet.packetStatus}).`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to build packet",
      };
    }
  }

  const json = await fetchJson<{ success?: boolean; message?: string }>("/api/program/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "build_printable_packets",
      leadId,
      packetType,
      mode: "assisted",
    }),
  });
  return {
    success: json.success ?? false,
    message: json.message,
    error: json.success ? undefined : json.message,
  };
}

export async function findMissingDocumentsAction(leadId: string): Promise<{
  documents: import("@/lib/types/program").RequiredDocument[];
}> {
  if (isLocalPreviewMode()) {
    const result = await runDocumentFinder(leadId);
    return { documents: result.documents };
  }

  const json = await fetchJson<{ details?: { documents?: import("@/lib/types/program").RequiredDocument[] } }>(
    "/api/program/run",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "find_missing_documents", leadId, mode: "assisted" }),
    }
  );
  return { documents: json.details?.documents ?? [] };
}

export function getLeadLabel(leadId: string): string {
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) return leadId;
  return lead.propertyAddress ?? lead.ownerName ?? leadId;
}

export async function saveDraftPacketAction(
  leadId: string,
  packetType: LeadPacketType
): Promise<{ success: boolean; packetId?: string; message?: string; error?: string }> {
  if (isLocalPreviewMode()) {
    try {
      const packet = await buildLeadPacket({ leadId, packetType, saveAsDraft: true });
      return { success: true, packetId: packet.id, message: `Draft packet v${packet.packetVersion} saved.` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save draft" };
    }
  }
  const json = await fetchJson<{ success?: boolean; message?: string; details?: { packetId?: string } }>(
    "/api/program/run",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "build_printable_packets", leadId, packetType, mode: "assisted", saveAsDraft: true }),
    }
  );
  return {
    success: json.success ?? false,
    packetId: json.details?.packetId,
    message: json.message,
    error: json.success ? undefined : json.message,
  };
}

export async function generatePdfPlaceholderAction(
  packetId: string
): Promise<{ pdfUrl?: string; error?: string }> {
  const placeholder = generatePdfPlaceholderUrl(packetId);
  if (isLocalPreviewMode()) {
    const packet = getProgramPacket(packetId);
    if (!packet) return { error: "Packet not found." };
    updateProgramPacket(packetId, { pdfUrl: placeholder });
    return { pdfUrl: placeholder };
  }
  const json = await fetchJson<{ pdfUrl?: string; error?: string }>(`/api/packets/actions/${packetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "pdf_placeholder" }),
  });
  return json;
}

export async function saveToFirstArchiveAction(
  packetId: string
): Promise<{ archive?: LeadArchive; error?: string; message?: string }> {
  if (isLocalPreviewMode()) {
    const packet = getProgramPacket(packetId);
    if (!packet) return { error: "Packet not found." };
    const archive = saveToInitialReviewArchive(packetId, "First Archive — Step 14 · Initial Review Archive");
    updateProgramPacket(packetId, { archivedAt: archive.archivedAt, packetStatus: "archived" });
    return { archive, message: "Saved to First Archive (Step 14)." };
  }
  const json = await fetchJson<{ archive?: LeadArchive; error?: string; message?: string }>(
    `/api/packets/actions/${packetId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "first_archive", notes: "First Archive — Step 14 review packet" }),
    }
  );
  return json;
}

export async function sendToAttorneyReviewAction(
  leadId: string,
  packetId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isLocalPreviewMode()) {
    try {
      await buildAttorneyReviewFileClient(leadId, packetId);
      updateProgramPacket(packetId, { attorneyReviewStatus: "ready_for_attorney_review" });
      return {
        success: true,
        message: "Packet sent to Attorney Review workflow. Draft documents require attorney/title review before use.",
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to send to attorney review" };
    }
  }
  const json = await fetchJson<{ success?: boolean; message?: string; error?: string }>(
    `/api/packets/actions/${packetId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_attorney_review", leadId }),
    }
  );
  return {
    success: json.success ?? false,
    message: json.message,
    error: json.error,
  };
}

export async function loadDraftDocumentsAction(leadId: string, packetId?: string): Promise<{
  documents: DraftSignatureDocument[];
}> {
  if (isLocalPreviewMode()) {
    return { documents: getDraftSignatureDocuments({ leadId, packetId }) };
  }
  const params = new URLSearchParams({ leadId });
  if (packetId) params.set("packetId", packetId);
  return fetchJson(`/api/packets/drafts?${params.toString()}`);
}
