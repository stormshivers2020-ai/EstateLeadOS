import { FINAL_ARCHIVE_STEP, FIRST_ARCHIVE_STEP } from "@/lib/constants/process-steps";
import {
  ARCHIVE_FILE_CATEGORY_LABELS,
  FINAL_ARCHIVE_FILE_CATEGORIES,
  INITIAL_ARCHIVE_FILE_CATEGORIES,
} from "@/lib/constants/archive-system";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getAttorneyCompensation, getAttorneyReview } from "@/lib/services/distribution/local-store";
import { logDistributionAudit, getDistributionAuditLogs } from "@/lib/services/distribution/local-store";
import { getLatestCalculation } from "@/lib/services/deal-calculator";
import type {
  ArchiveFile,
  ArchiveStage,
  ArchiveTabId,
  LeadArchive,
  LeadPacket,
  LeadPacketSection,
} from "@/lib/types/program";
import {
  getArchiveFiles,
  getDraftSignatureDocuments,
  getLeadArchives,
  getPacketPrintLogs,
  getProgramPacket,
  getProgramPackets,
  saveArchiveFiles,
  saveLeadArchive,
  updateLeadArchive,
} from "./local-store";

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

function createArchiveFile(input: {
  archiveId: string;
  leadId: string;
  packetId: string | null;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileCategory: string;
  generatedBy: string;
  notes?: string | null;
  auditReference?: string | null;
}): ArchiveFile {
  const session = getSessionContext();
  const ts = now();
  const versionNumber = nextFileVersion(input.archiveId, input.fileCategory);
  return {
    id: uid("af"),
    organizationId: session.organizationId,
    leadId: input.leadId,
    archiveId: input.archiveId,
    packetId: input.packetId,
    fileName: input.fileName,
    fileType: input.fileType,
    fileUrl: input.fileUrl,
    fileCategory: input.fileCategory,
    versionNumber,
    status: "active",
    uploadedBy: session.userName,
    generatedBy: input.generatedBy,
    uploadedAt: ts,
    generatedAt: ts,
    locked: false,
    supersededBy: null,
    notes: input.notes ?? null,
    auditReference: input.auditReference ?? null,
    createdAt: ts,
    updatedAt: ts,
  };
}

function sectionFile(section: LeadPacketSection, archiveId: string, packet: LeadPacket): ArchiveFile | null {
  const categoryMap: Record<string, string> = {
    government_proof_chain: "government_proof_chain",
    evidence: "source_citations",
    visuals: "property_visuals",
    missing: "missing_document_report",
    deal_calculator: "deal_calculator_printout",
    assignment_readiness: "assignment_readiness_checklist",
    assignment: "assignment_readiness_checklist",
    audit: "audit_summary",
    lead_summary: "internal_review_packet",
    cover: "original_acquisition_packet",
  };
  const category = categoryMap[section.sectionType];
  if (!category) return null;
  return createArchiveFile({
    archiveId,
    leadId: packet.leadId,
    packetId: packet.id,
    fileName: `${section.sectionTitle.replace(/\s+/g, "-").toLowerCase()}-v${packet.packetVersion}.html`,
    fileType: "text/html",
    fileUrl: `archive://${archiveId}/${category}/v${packet.packetVersion}`,
    fileCategory: category,
    generatedBy: packet.generatedBy,
    notes: section.sectionTitle,
    auditReference: section.id,
  });
}

function buildInitialArchiveFiles(archive: LeadArchive, packet: LeadPacket): ArchiveFile[] {
  const files: ArchiveFile[] = [];

  files.push(
    createArchiveFile({
      archiveId: archive.id,
      leadId: packet.leadId,
      packetId: packet.id,
      fileName: `acquisition-packet-v${packet.packetVersion}.html`,
      fileType: "text/html",
      fileUrl: `archive://${archive.id}/printable_html/v${packet.packetVersion}`,
      fileCategory: "original_acquisition_packet",
      generatedBy: packet.generatedBy,
      notes: "Full printable HTML snapshot — never overwritten",
      auditReference: packet.id,
    })
  );

  for (const section of packet.sections ?? []) {
    const file = sectionFile(section, archive.id, packet);
    if (file) files.push(file);
  }

  const drafts = getDraftSignatureDocuments({ leadId: packet.leadId, packetId: packet.id });
  for (const draft of drafts) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId: packet.leadId,
        packetId: packet.id,
        fileName: `${draft.documentType}-v${draft.templateVersion}.html`,
        fileType: "text/html",
        fileUrl: `archive://${archive.id}/draft/${draft.id}`,
        fileCategory: "draft_signature_documents",
        generatedBy: packet.generatedBy,
        notes: draft.documentName,
        auditReference: draft.id,
      })
    );
  }

  const prints = getPacketPrintLogs({ leadId: packet.leadId, packetId: packet.id });
  if (prints[0]) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId: packet.leadId,
        packetId: packet.id,
        fileName: `first-print-v${prints.length}.log`,
        fileType: "application/json",
        fileUrl: `archive://${archive.id}/print/${prints[0].id}`,
        fileCategory: "first_print_record",
        generatedBy: prints[0].printedBy,
        notes: `First print ${new Date(prints[0].printedAt).toLocaleString()}`,
        auditReference: prints[0].id,
      })
    );
  } else if (getLatestCalculation(packet.leadId)) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId: packet.leadId,
        packetId: packet.id,
        fileName: `deal-calculator-v${packet.packetVersion}.html`,
        fileType: "text/html",
        fileUrl: `archive://${archive.id}/deal_calc/v${packet.packetVersion}`,
        fileCategory: "deal_calculator_printout",
        generatedBy: packet.generatedBy,
        notes: "Deal calculator printout reference",
      })
    );
  }

  for (const cat of INITIAL_ARCHIVE_FILE_CATEGORIES) {
    if (!files.some((f) => f.fileCategory === cat)) {
      files.push(
        createArchiveFile({
          archiveId: archive.id,
          leadId: packet.leadId,
          packetId: packet.id,
          fileName: `${cat}-placeholder-v${packet.packetVersion}.txt`,
          fileType: "text/plain",
          fileUrl: `archive://${archive.id}/${cat}/placeholder`,
          fileCategory: cat,
          generatedBy: packet.generatedBy,
          notes: "Placeholder — section not present in packet build",
        })
      );
    }
  }

  return files;
}

function buildFinalArchiveFiles(archive: LeadArchive, packet: LeadPacket, leadId: string): ArchiveFile[] {
  const review = getAttorneyReview(leadId);
  const files: ArchiveFile[] = [];

  if (review?.attorneyReviewFileHtml) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId,
        packetId: packet.id,
        fileName: `attorney-review-file-v${packet.packetVersion}.html`,
        fileType: "text/html",
        fileUrl: `archive://${archive.id}/attorney_review_file`,
        fileCategory: "attorney_reviewed_packet",
        generatedBy: review.reviewStatus,
        notes: "Attorney review export file",
      })
    );
  }

  const uploadCategoryMap: Record<string, string> = {
    attorney_reviewed_packet: "attorney_reviewed_packet",
    attorney_approval_letter: "attorney_approval_notes",
    attorney_redlines: "attorney_redlines",
    attorney_comments: "attorney_approval_notes",
    signed_documents: "signed_revised_documents",
    revised_draft_documents: "signed_revised_documents",
    attorney_engagement_agreement: "attorney_engagement_agreement",
    attorney_fee_agreement: "attorney_fee_agreement",
    title_company_notes: "title_company_notes",
    disclosure_checklist: "final_disclosure_checklist",
    revised_buyer_packet: "final_distribution_packet",
    revised_assignment_packet: "final_assignment_readiness",
  };

  for (const upload of review?.uploads ?? []) {
    const category = uploadCategoryMap[upload.documentCategory] ?? "signed_revised_documents";
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId,
        packetId: packet.id,
        fileName: upload.fileName,
        fileType: upload.fileType,
        fileUrl: upload.fileUrl,
        fileCategory: category,
        generatedBy: upload.uploadedBy,
        notes: `Upload v${upload.versionNumber} · ${upload.documentCategory}`,
        auditReference: upload.id,
      })
    );
  }

  if (review?.reviewNotes) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId,
        packetId: packet.id,
        fileName: `attorney-approval-notes-v${archive.packetVersion}.txt`,
        fileType: "text/plain",
        fileUrl: `archive://${archive.id}/approval_notes`,
        fileCategory: "attorney_approval_notes",
        generatedBy: review.attorneyName ?? "user",
        notes: review.reviewNotes,
      })
    );
  }

  const prints = getPacketPrintLogs({ leadId, packetId: packet.id });
  if (prints[0]) {
    files.push(
      createArchiveFile({
        archiveId: archive.id,
        leadId,
        packetId: packet.id,
        fileName: `final-print-v${prints.length}.log`,
        fileType: "application/json",
        fileUrl: `archive://${archive.id}/final_print/${prints[0].id}`,
        fileCategory: "final_print_record",
        generatedBy: prints[0].printedBy,
        auditReference: prints[0].id,
      })
    );
  }

  files.push(
    createArchiveFile({
      archiveId: archive.id,
      leadId,
      packetId: packet.id,
      fileName: `final-audit-trail-v${archive.packetVersion}.json`,
      fileType: "application/json",
      fileUrl: `archive://${archive.id}/final_audit`,
      fileCategory: "final_audit_trail",
      generatedBy: archive.archivedBy,
      notes: "Final archive audit reference",
      auditReference: archive.id,
    })
  );

  for (const cat of FINAL_ARCHIVE_FILE_CATEGORIES) {
    if (!files.some((f) => f.fileCategory === cat)) {
      files.push(
        createArchiveFile({
          archiveId: archive.id,
          leadId,
          packetId: packet.id,
          fileName: `${cat}-pending-v${archive.packetVersion}.txt`,
          fileType: "text/plain",
          fileUrl: `archive://${archive.id}/${cat}/pending`,
          fileCategory: cat,
          generatedBy: archive.archivedBy,
          notes: "Pending — upload via Attorney Review workflow",
        })
      );
    }
  }

  return files;
}

function baseArchiveRecord(packet: LeadPacket, stage: ArchiveStage, notes?: string): LeadArchive {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(packet.leadId);
  const review = getAttorneyReview(packet.leadId);
  const comp = getAttorneyCompensation(packet.leadId);
  const ts = now();

  return {
    id: uid("la"),
    organizationId: session.organizationId,
    leadId: packet.leadId,
    packetId: packet.id,
    archiveStage: stage,
    archiveStatus:
      stage === "final_attorney_reviewed"
        ? review?.reviewStatus === "approved" || review?.reviewStatus === "approved_with_notes"
          ? "final_approved"
          : "attorney_reviewed"
        : packet.packetStatus === "missing_documents"
          ? "missing_documents"
          : "ready_for_review",
    archiveType: packet.packetType,
    archivedBy: session.userName,
    archivedAt: ts,
    archiveNotes: notes ?? null,
    printCount: 0,
    lastPrintedAt: null,
    locked: false,
    packetVersion: packet.packetVersion,
    propertyAddress: lead?.propertyAddress ?? null,
    countyName: lead?.county ?? null,
    stateAbbr: lead?.state ?? null,
    confidenceScore: packet.confidenceScore,
    verificationStatus: packet.verificationStatus,
    attorneyReviewStatus: review?.reviewStatus ?? packet.attorneyReviewStatus,
    signatureStatus: comp?.writtenAgreementUploaded ? "written_agreement_on_file" : "pending_review",
    nextAction:
      stage === "initial_review"
        ? "Send to Attorney Review (Step 15)"
        : `Final outcome archive (Step 26)`,
    generatedAt: packet.generatedAt,
    supersededBy: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function saveToInitialReviewArchive(packetId: string, notes?: string): LeadArchive {
  const packet = getProgramPacket(packetId);
  if (!packet) throw new Error("Packet not found");

  const archive = baseArchiveRecord(
    packet,
    "initial_review",
    notes ?? `Initial Review Archive — Step ${FIRST_ARCHIVE_STEP}`
  );
  saveLeadArchive(archive);
  const files = buildInitialArchiveFiles(archive, packet);
  saveArchiveFiles(files);

  logDistributionAudit({
    leadId: packet.leadId,
    packetId: packet.id,
    actionType: "initial_archive_saved",
    actionDescription: `Initial Review Archive v${packet.packetVersion} saved (${files.length} files) — not overwritten`,
    metadata: { archiveId: archive.id, stage: "initial_review", fileCount: files.length },
  });

  return archive;
}

export function saveToFinalAttorneyArchive(leadId: string): LeadArchive {
  const review = getAttorneyReview(leadId);
  if (!review?.packetId) throw new Error("Select a packet and complete attorney review first");

  const hasReviewedFile =
    review.uploads.some((u) => u.documentCategory === "attorney_reviewed_packet") || review.approvedFileUrl;
  if (!hasReviewedFile) throw new Error("Upload an attorney-reviewed file before Final Archive.");

  const packet = getProgramPacket(review.packetId);
  if (!packet) throw new Error("Source packet not found");

  const archive = baseArchiveRecord(
    packet,
    "final_attorney_reviewed",
    `Final Attorney-Reviewed Archive — Step ${FINAL_ARCHIVE_STEP}`
  );
  const files = buildFinalArchiveFiles(archive, packet, leadId);
  saveLeadArchive(archive);
  saveArchiveFiles(files);

  logDistributionAudit({
    leadId,
    packetId: packet.id,
    actionType: "final_archive_saved",
    actionDescription: `Final Attorney-Reviewed Archive v${packet.packetVersion} saved (${files.length} files)`,
    relatedAttorneyReviewId: review.id,
    metadata: { archiveId: archive.id, stage: "final_attorney_reviewed", fileCount: files.length },
  });

  return archive;
}

export function lockArchiveVersion(archiveId: string): LeadArchive {
  const archive = getLeadArchives().find((a) => a.id === archiveId);
  if (!archive) throw new Error("Archive not found");
  if (archive.locked) throw new Error("Archive version already locked");

  const updated = updateLeadArchive(archiveId, { locked: true, archiveStatus: "final_approved" });
  if (!updated) throw new Error("Could not lock archive");

  const files = getArchiveFiles({ archiveId }).map((f) => ({ ...f, locked: true, status: "locked" as const, updatedAt: now() }));
  saveArchiveFiles(files);

  logDistributionAudit({
    leadId: archive.leadId,
    packetId: archive.packetId,
    actionType: "archive_locked",
    actionDescription: `Archive v${archive.packetVersion} locked — no overwrites permitted`,
    metadata: { archiveId },
  });

  return updated;
}

export function markArchiveSuperseded(archiveId: string, supersededBy?: string): LeadArchive {
  const archive = getLeadArchives().find((a) => a.id === archiveId);
  if (!archive) throw new Error("Archive not found");
  const updated = updateLeadArchive(archiveId, {
    archiveStatus: "superseded",
    supersededBy: supersededBy ?? null,
  });
  if (!updated) throw new Error("Could not mark superseded");

  const files = getArchiveFiles({ archiveId }).map((f) => ({
    ...f,
    status: "superseded" as const,
    supersededBy: supersededBy ?? null,
    updatedAt: now(),
  }));
  saveArchiveFiles(files);

  logDistributionAudit({
    leadId: archive.leadId,
    packetId: archive.packetId,
    actionType: "archive_superseded",
    actionDescription: `Archive v${archive.packetVersion} marked superseded — preserved, not overwritten`,
    metadata: { archiveId, supersededBy },
  });

  return updated;
}

export function markArchiveRejected(archiveId: string): LeadArchive {
  const archive = getLeadArchives().find((a) => a.id === archiveId);
  if (!archive) throw new Error("Archive not found");
  const updated = updateLeadArchive(archiveId, { archiveStatus: "rejected" });
  if (!updated) throw new Error("Could not mark rejected");

  logDistributionAudit({
    leadId: archive.leadId,
    packetId: archive.packetId,
    actionType: "archive_rejected",
    actionDescription: `Archive v${archive.packetVersion} marked rejected`,
    metadata: { archiveId },
  });

  return updated;
}

export function duplicateArchiveNewVersion(archiveId: string): { message: string; packetId: string } {
  const archive = getLeadArchives().find((a) => a.id === archiveId);
  if (!archive) throw new Error("Archive not found");
  return {
    message: `Build a new packet version from Lead Detail. Archive v${archive.packetVersion} is preserved — versions are never overwritten.`,
    packetId: archive.packetId,
  };
}

export interface ArchiveHubItem extends LeadArchive {
  files: ArchiveFile[];
  leadLabel: string;
}

export interface ArchiveHubData {
  tab: ArchiveTabId;
  items: ArchiveHubItem[];
  readyToPrint: LeadPacket[];
  stats: {
    initialCount: number;
    finalCount: number;
    totalFiles: number;
    lockedCount: number;
  };
  auditLogs: import("@/lib/types/distribution").DistributionAuditLog[];
}

export function getArchiveHubData(tab: ArchiveTabId = "all"): ArchiveHubData {
  const allArchives = getLeadArchives().map((a) => ({
    ...a,
    archiveStage: a.archiveStage ?? (a.archiveType === "attorney_title_review" ? "final_attorney_reviewed" : "initial_review"),
  })) as LeadArchive[];

  const allFiles = ensureArchiveFilesLoaded();
  const packets = getProgramPackets();
  const archivedPacketIds = new Set(allArchives.map((a) => a.packetId));
  const readyToPrint = packets.filter((p) => p.printableHtml && !archivedPacketIds.has(p.id));

  const toItem = (archive: LeadArchive): ArchiveHubItem => {
    const lead = getFullLeadByIdSync(archive.leadId);
    return {
      ...archive,
      files: allFiles.filter((f) => f.archiveId === archive.id),
      leadLabel: lead?.propertyAddress ?? lead?.ownerName ?? archive.leadId,
    };
  };

  let filtered = allArchives;
  switch (tab) {
    case "initial_review":
      filtered = allArchives.filter((a) => a.archiveStage === "initial_review");
      break;
    case "final_attorney_reviewed":
      filtered = allArchives.filter((a) => a.archiveStage === "final_attorney_reviewed");
      break;
    case "ready_for_attorney":
      filtered = allArchives.filter(
        (a) =>
          a.archiveStage === "initial_review"
          && ["ready_for_review", "ready_for_attorney", "missing_documents"].includes(a.archiveStatus)
      );
      break;
    case "attorney_reviewed":
      filtered = allArchives.filter((a) => a.archiveStatus === "attorney_reviewed" || a.archiveStage === "final_attorney_reviewed");
      break;
    case "final_approved":
      filtered = allArchives.filter((a) => a.archiveStatus === "final_approved" || a.locked);
      break;
    case "rejected_superseded":
      filtered = allArchives.filter((a) => a.archiveStatus === "rejected" || a.archiveStatus === "superseded");
      break;
    case "ready_to_print":
      filtered = [];
      break;
    case "all":
    default:
      filtered = allArchives;
  }

  return {
    tab,
    items: filtered.map(toItem),
    readyToPrint: tab === "ready_to_print" ? readyToPrint : readyToPrint,
    stats: {
      initialCount: allArchives.filter((a) => a.archiveStage === "initial_review").length,
      finalCount: allArchives.filter((a) => a.archiveStage === "final_attorney_reviewed").length,
      totalFiles: allFiles.length,
      lockedCount: allArchives.filter((a) => a.locked).length,
    },
    auditLogs: getDistributionAuditLogs().filter((l) =>
      /archive/i.test(l.actionType) || /archive/i.test(l.actionDescription)
    ),
  };
}

function ensureArchiveFilesLoaded(): ArchiveFile[] {
  return getArchiveFiles();
}

export function getArchivePrintableHtml(archiveId: string): string | null {
  const archive = getLeadArchives().find((a) => a.id === archiveId);
  if (!archive) return null;
  const packet = getProgramPacket(archive.packetId);
  return packet?.printableHtml ?? null;
}

export function getArchiveFileDownloadUrl(file: ArchiveFile): string {
  if (file.fileUrl.startsWith("http") || file.fileUrl.startsWith("/")) return file.fileUrl;
  return file.fileUrl;
}

export { ARCHIVE_FILE_CATEGORY_LABELS };
