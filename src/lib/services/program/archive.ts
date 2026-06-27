import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import type { LeadArchive, LeadPacket } from "@/lib/types/program";
import {
  getLeadArchives,
  logPacketPrint,
  saveLeadArchive,
  updateLeadArchive,
  getProgramPackets,
} from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function archivePacket(packet: LeadPacket, notes?: string): LeadArchive {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(packet.leadId);

  const archive: LeadArchive = {
    id: uid("la"),
    organizationId: session.organizationId,
    leadId: packet.leadId,
    packetId: packet.id,
    archiveStatus: packet.packetStatus === "missing_documents" ? "missing_documents" : "ready_for_review",
    archiveType: packet.packetType,
    archivedBy: session.userName,
    archivedAt: now(),
    archiveNotes: notes ?? null,
    printCount: 0,
    lastPrintedAt: null,
    countyName: lead?.county ?? null,
    stateAbbr: lead?.state ?? null,
    confidenceScore: packet.confidenceScore,
    verificationStatus: packet.verificationStatus,
    createdAt: now(),
    updatedAt: now(),
  };

  return saveLeadArchive(archive);
}

export function recordPacketPrint(packetId: string, leadId: string, printType = "browser"): void {
  const session = getSessionContext();
  logPacketPrint({
    organizationId: session.organizationId,
    leadId,
    packetId,
    printedBy: session.userName,
    printType,
    notes: null,
  });

  const archives = getLeadArchives({ leadId });
  const archive = archives.find((a) => a.packetId === packetId);
  if (archive) {
    updateLeadArchive(archive.id, {
      printCount: archive.printCount + 1,
      lastPrintedAt: now(),
    });
  }
}

export function getArchiveOverview() {
  const archives = getLeadArchives();
  return {
    total: archives.length,
    readyForReview: archives.filter((a) => a.archiveStatus === "ready_for_review").length,
    missingDocuments: archives.filter((a) => a.archiveStatus === "missing_documents").length,
    complianceBlocked: archives.filter((a) => a.archiveStatus === "compliance_blocked").length,
    buyerReviewReady: archives.filter((a) => a.archiveStatus === "buyer_review_ready").length,
    assignmentReviewReady: archives.filter((a) => a.archiveStatus === "assignment_review_ready").length,
    archivedClosed: archives.filter((a) => a.archiveStatus === "archived_closed").length,
    rejected: archives.filter((a) => a.archiveStatus === "rejected").length,
    needsManualResearch: archives.filter((a) => a.archiveStatus === "needs_manual_research").length,
    archives,
    packets: getProgramPackets(),
  };
}

export function duplicatePacketVersion(packet: LeadPacket): { message: string } {
  return {
    message: `Create a new version via Packet Builder — current version is v${packet.packetVersion}. Previous versions are preserved in archive.`,
  };
}
