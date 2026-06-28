import "server-only";

import { getSessionContext } from "@/lib/config/session";
import { saveArchiveFiles } from "@/lib/services/program/local-store";
import type { ArchiveFile, LeadArchive } from "@/lib/types/program";
import type { DistributionPacket, EmailDistribution } from "@/lib/types/distribution";
import { getArchiveFiles } from "@/lib/services/program/local-store";
import { logDistributionAudit, saveDistributionPacket } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function nextFileVersion(archiveId: string, category: string): number {
  const existing = getArchiveFiles({ archiveId }).filter((f) => f.fileCategory === category);
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((f) => f.versionNumber)) + 1;
}

/** Step 14 — archive distribution record to Final Archive without overwriting prior files */
export function archiveDistributionRecord(
  email: EmailDistribution,
  packet: DistributionPacket,
  finalArchive: LeadArchive
): ArchiveFile {
  const session = getSessionContext();
  const ts = now();
  const versionNumber = nextFileVersion(finalArchive.id, "final_distribution_packet");

  const file: ArchiveFile = {
    id: uid("af"),
    organizationId: session.organizationId,
    leadId: packet.leadId,
    archiveId: finalArchive.id,
    packetId: packet.sourcePacketId ?? null,
    fileName: `email-distribution-${email.id}-v${versionNumber}.json`,
    fileType: "application/json",
    fileUrl: `archive://${finalArchive.id}/email_distribution/${email.id}`,
    fileCategory: "final_distribution_packet",
    versionNumber,
    status: "active",
    uploadedBy: session.userName,
    generatedBy: email.sentBy ?? session.userName,
    uploadedAt: ts,
    generatedAt: ts,
    locked: false,
    supersededBy: null,
    notes: `Email to ${email.recipientEmail} · ${email.subject} · ${email.simulated ? "simulated" : "sent"}`,
    auditReference: email.id,
    createdAt: ts,
    updatedAt: ts,
  };

  saveArchiveFiles([file]);

  saveDistributionPacket({
    ...packet,
    packetStatus: "archived",
    updatedAt: ts,
  });

  logDistributionAudit({
    leadId: packet.leadId,
    packetId: packet.id,
    actionType: "distribution_record_archived",
    actionDescription: `Distribution record archived to Final Archive v${versionNumber} — not overwritten`,
    relatedRecipientId: email.recipientId,
    metadata: { emailId: email.id, archiveFileId: file.id },
  });

  return file;
}
