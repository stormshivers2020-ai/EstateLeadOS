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
import { saveToInitialReviewArchive, getArchiveHubData } from "./archive-hub";

function now(): string {
  return new Date().toISOString();
}

/** @deprecated Prefer saveToInitialReviewArchive for Step 14 first archive */
export function archivePacket(packet: LeadPacket, notes?: string): LeadArchive {
  return saveToInitialReviewArchive(packet.id, notes);
}

export function recordPacketPrint(
  packetId: string,
  leadId: string,
  printType = "browser",
  archiveId?: string | null
): void {
  const session = getSessionContext();
  logPacketPrint({
    organizationId: session.organizationId,
    leadId,
    packetId,
    archiveId: archiveId ?? null,
    printedBy: session.userName,
    printType,
    notes: null,
  });

  const archives = getLeadArchives({ leadId });
  const archive = archives.find((a) => a.packetId === packetId || a.id === archiveId);
  if (archive) {
    updateLeadArchive(archive.id, {
      printCount: archive.printCount + 1,
      lastPrintedAt: now(),
    });
  }
}

export function getArchiveOverview() {
  const hub = getArchiveHubData("all");
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
    initialReviewCount: hub.stats.initialCount,
    finalReviewCount: hub.stats.finalCount,
    archives,
    packets: getProgramPackets(),
    hub,
  };
}

export function duplicatePacketVersion(packet: LeadPacket): { message: string } {
  return {
    message: `Create a new version via Packet Builder — current version is v${packet.packetVersion}. Previous versions are preserved in archive.`,
  };
}

export {
  saveToInitialReviewArchive,
  saveToFinalAttorneyArchive,
  getArchiveHubData,
  lockArchiveVersion,
  markArchiveSuperseded,
  markArchiveRejected,
  duplicateArchiveNewVersion,
  getArchivePrintableHtml,
  type ArchiveHubData,
  type ArchiveHubItem,
} from "./archive-hub";
