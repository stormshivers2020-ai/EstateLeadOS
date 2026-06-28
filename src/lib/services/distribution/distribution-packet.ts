import "server-only";

import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { REDACTION_CHECKLIST } from "@/lib/constants/distribution-templates";
import { DISTRIBUTION_BRAND_FOOTER } from "@/lib/constants/email-distribution-workflow";
import { DISTRIBUTION_PACKET_WARNING, DISTRIBUTION_TYPE_LABELS } from "@/lib/types/distribution";
import type { DistributionPacket, DistributionPacketStatus, DistributionPacketType } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import { getArchiveFiles, getAssignmentReadiness, getLeadArchives, getProgramPacket } from "@/lib/services/program/local-store";
import { isAttorneyApproved } from "./attorney-review";
import { checkAttorneyApprovalGate } from "./approval-gate";
import { getDistributionPackets, saveDistributionPacket, logDistributionAudit, getAttorneyReview } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getFinalArchivesForLead(leadId: string) {
  return getLeadArchives({ leadId }).filter((a) => a.archiveStage === "final_attorney_reviewed");
}

export async function buildDistributionPacket(input: {
  leadId: string;
  packetType: DistributionPacketType;
  finalArchiveId?: string;
  sourcePacketId?: string;
  includeAttorneyNotes?: boolean;
  hideInternalProfitNotes?: boolean;
}): Promise<DistributionPacket> {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(input.leadId);
  if (!lead) throw new Error("Lead not found");

  const finalArchives = getFinalArchivesForLead(input.leadId);
  if (finalArchives.length === 0) {
    throw new Error(
      "Final Attorney-Reviewed Archive required. Complete attorney review and save to Final Archive (Step 19) first."
    );
  }

  const finalArchive =
    (input.finalArchiveId ? finalArchives.find((a) => a.id === input.finalArchiveId) : null)
    ?? finalArchives[0];

  const sourcePacketId = input.sourcePacketId ?? finalArchive.packetId;
  const sourcePacket = sourcePacketId ? getProgramPacket(sourcePacketId) : null;
  const archiveFiles = getArchiveFiles({ archiveId: finalArchive.id });

  const attorneyReview = getAttorneyReview(input.leadId);
  const ar = getAssignmentReadiness(input.leadId);
  let evidence = null;
  try {
    evidence = await getLeadVerificationBundle(input.leadId);
  } catch {
    evidence = null;
  }

  const existing = getDistributionPackets({ leadId: input.leadId }).filter(
    (p) => p.packetType === input.packetType
  );
  const version = existing.length > 0 ? Math.max(...existing.map((p) => p.packetVersion)) + 1 : 1;

  const govFilter = (s: { sourceType: string; sourceName: string }) => {
    const t = `${s.sourceType} ${s.sourceName}`.toLowerCase();
    return t.includes("government") || t.includes("county") || t.includes("assessor") || t.includes("probate") || t.includes("official");
  };

  const govEvidence =
    evidence?.evidenceSources
      ?.filter(govFilter)
      .slice(0, 8)
      .map(
        (e) =>
          `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> (confirmed public record)<br/>${escapeHtml(e.sourceUrl ?? "")}</div>`
      )
      .join("") ?? "<p>Public-record evidence pending.</p>";

  const confirmedFacts =
    evidence?.proofChain
      ?.filter((s) => s.status === "complete")
      .slice(0, 10)
      .map((s) => `<li class="confirmed">${escapeHtml(s.title)}</li>`)
      .join("") ?? "<li>Owner/property facts pending verification.</li>";

  const missingItems =
    evidence?.proofChain
      ?.filter((s) => s.status === "missing")
      .slice(0, 8)
      .map((s) => `<li class="missing">${escapeHtml(s.title)}</li>`)
      .join("") ?? "<li>No missing items flagged.</li>";

  const riskNotes =
    evidence?.proofChain
      ?.filter((s) => s.status === "partial" || s.status === "missing")
      .slice(0, 6)
      .map((s) => `<li>${escapeHtml(s.description)}</li>`)
      .join("") ?? "<li>Review all title, probate, and disclosure risks with qualified professionals.</li>";

  const visuals =
    evidence?.propertyMedia
      ?.map(
        (m) =>
          `<div><img src="${escapeHtml(m.mediaUrl ?? "")}" style="max-width:100%" alt="Property visual"/><p><em>${escapeHtml(m.attribution ?? "Official source")}</em></p></div>`
      )
      .join("") ?? "";

  const attorneyNotes =
    input.includeAttorneyNotes !== false && attorneyReview?.attorneyApprovalNotes
      ? `<p><strong>Attorney-reviewed notes (approved to share):</strong> ${escapeHtml(attorneyReview.attorneyApprovalNotes)}</p>`
      : "";

  const reviewedFileRef = archiveFiles.find((f) => f.fileCategory === "attorney_reviewed_packet");
  const finalArchiveRef = reviewedFileRef
    ? `<p class="confirmed">Source: Final Archive file v${reviewedFileRef.versionNumber} — ${escapeHtml(reviewedFileRef.fileName)}</p>`
    : `<p class="missing">Final archive attorney-reviewed file reference pending.</p>`;

  const hideProfit = input.hideInternalProfitNotes ?? false;
  const profitSection = hideProfit
    ? `<p><em>Internal profit notes hidden from external distribution by user choice.</em></p>`
    : `<p class="estimated">Target Assignment Fee: ${ar?.targetAssignmentFee ?? "Not entered"}</p>
       <p class="estimated">Minimum Acceptable Spread: ${ar?.minimumAcceptableSpread ?? "Not entered"}</p>`;

  const reviewInstructions = `<ul>
    <li>Review public-record summaries and property visuals.</li>
    <li>Confirm whether the opportunity fits your buying criteria.</li>
    <li>Do not treat estimated assumptions as guarantees.</li>
    <li>Contact the sender for questions — do not rely on unverified enrichment.</li>
  </ul>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(DISTRIBUTION_TYPE_LABELS[input.packetType])}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;font-size:11pt;color:#111}
h1{font-size:18pt;border-bottom:2px solid #333}h2{font-size:13pt;margin-top:16px}
.confirmed{color:#1a5}.estimated{color:#85a}.missing{color:#a51}
.disclaimer,.warning{font-size:9pt;border-left:3px solid #c9a227;padding:8px;color:#555;margin:12px 0}
.citation{margin:8px 0;padding:8px;background:#f8f8f8}
.cover{text-align:center;padding:48px 24px;border:2px solid #333;margin-bottom:24px}
</style></head><body>

<div class="cover">
<h1>${escapeHtml(DISTRIBUTION_TYPE_LABELS[input.packetType])}</h1>
<p><strong>${escapeHtml(DISTRIBUTION_BRAND_FOOTER)}</strong></p>
<p>${escapeHtml(lead.propertyAddress)} · ${escapeHtml(lead.county)}, ${escapeHtml(lead.state)}</p>
<p class="warning">External distribution — separate from internal archive packets</p>
</div>

<p class="warning">${escapeHtml(DISTRIBUTION_PACKET_WARNING)}</p>
<p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>
${finalArchiveRef}

<h2>Property Summary</h2>
<p><strong>Address:</strong> ${escapeHtml(lead.propertyAddress)}</p>
<p><strong>County/State:</strong> ${escapeHtml(lead.county)}, ${escapeHtml(lead.state)}</p>

<h2>Public-Record Evidence Summary</h2>
<p class="confirmed">Government / confirmed public-record sources only in this section:</p>
${govEvidence}

<h2>Property Visuals</h2>
${visuals || "<p>No visuals attached.</p>"}

<h2>Confirmed Facts</h2>
<ul>${confirmedFacts}</ul>

<h2>Estimated Assumptions (User-Entered — Not Guarantees)</h2>
${profitSection}
<p class="estimated">Deal confidence score: ${lead.dataConfidenceScore} — not a guarantee of outcome or profit.</p>

<h2>Assignment / Equitable-Interest Disclosure Placeholder</h2>
<p><em>Contract-interest / assignment workflow — confirm assignability, disclosures, and marketing restrictions with licensed attorney and broker where required. EstateLeadOS does not confirm legal title or ownership.</em></p>

${attorneyNotes}

<h2>Missing Items</h2>
<ul>${missingItems}</ul>

<h2>Risk Notes</h2>
<ul>${riskNotes}</ul>

<h2>Review Instructions</h2>
${reviewInstructions}

<h2>Contact Instructions</h2>
<p>Contact the sender to discuss this opportunity. Rejected contact candidates and private internal notes are excluded from this packet.</p>

<h2>Disclaimer</h2>
<p class="disclaimer">This packet excludes private internal notes, attorney-private strategy notes unless approved, rejected sources, unsupported claims, and sensitive personal information not approved for sharing. No legal or profit guarantees are included.</p>

<p style="margin-top:24px;font-size:9pt;color:#888;text-align:center">${escapeHtml(DISTRIBUTION_BRAND_FOOTER)} · External Distribution v${version}${sourcePacket ? ` · Source packet v${sourcePacket.packetVersion}` : ""}</p>
</body></html>`;

  const attorneyApproved = attorneyReview ? isAttorneyApproved(attorneyReview.reviewStatus) : false;
  let status: DistributionPacketStatus = attorneyApproved ? "attorney_approved" : "needs_attorney_review";
  if (attorneyReview?.manualOverrideAcknowledged) status = "ready_for_user_review";

  const packet: DistributionPacket = {
    id: uid("dp"),
    organizationId: session.organizationId,
    leadId: input.leadId,
    sourcePacketId: sourcePacketId ?? null,
    finalArchiveId: finalArchive.id,
    attorneyReviewId: attorneyReview?.id ?? null,
    packetType: input.packetType,
    packetStatus: status,
    packetVersion: version,
    redactionChecklist: REDACTION_CHECKLIST.map((r) => ({ ...r, complete: false })),
    attorneyReviewStatus: attorneyReview?.reviewStatus ?? null,
    userApprovalStatus: "pending",
    hideInternalProfitNotes: hideProfit,
    printableHtml: html,
    pdfUrl: null,
    createdAt: now(),
    updatedAt: now(),
  };

  saveDistributionPacket(packet);
  logDistributionAudit({
    leadId: input.leadId,
    packetId: packet.id,
    actionType: "distribution_packet_created",
    actionDescription: `${DISTRIBUTION_TYPE_LABELS[input.packetType]} v${version} created from Final Archive ${finalArchive.id} (external-facing, redacted)`,
    relatedAttorneyReviewId: attorneyReview?.id,
    metadata: { finalArchiveId: finalArchive.id, archiveFileCount: archiveFiles.length },
  });

  return packet;
}

export function updateRedactionChecklist(
  packetId: string,
  itemId: string,
  complete: boolean
): DistributionPacket | null {
  const packet = getDistributionPackets().find((p) => p.id === packetId);
  if (!packet) return null;
  const checklist = packet.redactionChecklist.map((r) =>
    r.id === itemId ? { ...r, complete } : r
  );
  const updated = saveDistributionPacket({
    ...packet,
    redactionChecklist: checklist,
    updatedAt: now(),
  });
  if (
    checklist.every((r) => r.complete)
    && (updated.packetStatus === "attorney_approved" || updated.packetStatus === "ready_for_user_review")
  ) {
    return saveDistributionPacket({ ...updated, packetStatus: "ready_for_user_review" });
  }
  return updated;
}

export function approveDistributionForSend(packetId: string): DistributionPacket {
  const session = getSessionContext();
  const packet = getDistributionPackets().find((p) => p.id === packetId);
  if (!packet) throw new Error("Distribution packet not found");

  const gate = checkAttorneyApprovalGate(packet.leadId);
  if (!gate.allowed) {
    throw new Error(gate.blockers.join(" "));
  }

  if (!packet.redactionChecklist.every((r) => r.complete)) {
    throw new Error("Complete redaction checklist before approving for send.");
  }

  if (!packet.finalArchiveId) {
    throw new Error("Distribution packet must be linked to Final Attorney-Reviewed Archive.");
  }

  const updated = saveDistributionPacket({
    ...packet,
    packetStatus: "approved_to_send",
    userApprovalStatus: "approved",
    approvedToSendAt: now(),
    approvedBy: session.userName,
    updatedAt: now(),
  });

  logDistributionAudit({
    leadId: packet.leadId,
    packetId: packet.id,
    actionType: "packet_approved_for_send",
    actionDescription: "Distribution packet approved for external email send — user must still preview and approve email",
  });

  return updated;
}

export { DISTRIBUTION_TYPE_LABELS } from "@/lib/types/distribution";
