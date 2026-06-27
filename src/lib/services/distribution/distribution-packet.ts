import "server-only";

import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { REDACTION_CHECKLIST } from "@/lib/constants/distribution-templates";
import { DISTRIBUTION_PACKET_WARNING, DISTRIBUTION_TYPE_LABELS } from "@/lib/types/distribution";
import type { DistributionPacket, DistributionPacketStatus, DistributionPacketType } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import { getAssignmentReadiness } from "@/lib/services/program/local-store";
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

export async function buildDistributionPacket(input: {
  leadId: string;
  packetType: DistributionPacketType;
  sourcePacketId?: string;
  includeAttorneyNotes?: boolean;
}): Promise<DistributionPacket> {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(input.leadId);
  if (!lead) throw new Error("Lead not found");

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

  const govEvidence = evidence?.evidenceSources?.slice(0, 5).map(
    (e) => `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> (confirmed public record)<br/>${escapeHtml(e.sourceUrl ?? "")}</div>`
  ).join("") ?? "<p>Public-record evidence pending.</p>";

  const visuals = evidence?.propertyMedia?.map(
    (m) => `<div><img src="${escapeHtml(m.mediaUrl ?? "")}" style="max-width:100%" alt="Property visual"/><p><em>${escapeHtml(m.attribution ?? "Official source")}</em></p></div>`
  ).join("") ?? "";

  const attorneyNotes =
    input.includeAttorneyNotes && attorneyReview?.attorneyApprovalNotes
      ? `<p><strong>Attorney-reviewed notes (approved to share):</strong> ${escapeHtml(attorneyReview.attorneyApprovalNotes)}</p>`
      : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(DISTRIBUTION_TYPE_LABELS[input.packetType])}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;font-size:11pt;color:#111}
h1{font-size:18pt;border-bottom:2px solid #333}h2{font-size:13pt;margin-top:16px}
.confirmed{color:#1a5}.estimated{color:#85a}.missing{color:#a51}
.disclaimer,.warning{font-size:9pt;border-left:3px solid #c9a227;padding:8px;color:#555;margin:12px 0}
.citation{margin:8px 0;padding:8px;background:#f8f8f8}
</style></head><body>
<h1>${escapeHtml(DISTRIBUTION_TYPE_LABELS[input.packetType])}</h1>
<p><strong>EstateLeadOS — Powered by SCS Nova</strong></p>
<p class="warning">${escapeHtml(DISTRIBUTION_PACKET_WARNING)}</p>
<p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>

<h2>Property Summary</h2>
<p><strong>Address:</strong> ${escapeHtml(lead.propertyAddress)}</p>
<p><strong>County/State:</strong> ${escapeHtml(lead.county)}, ${escapeHtml(lead.state)}</p>

<h2>Public-Record Evidence Summary</h2>
<p class="confirmed">Confirmed facts from government sources:</p>
${govEvidence}

<h2>Property Visuals</h2>
${visuals || "<p>No visuals attached.</p>"}

<h2>Estimated Assumptions (user-entered)</h2>
<p class="estimated">Target Assignment Fee: ${ar?.targetAssignmentFee ?? "Not entered"}</p>
<p class="estimated">Minimum Acceptable Spread: ${ar?.minimumAcceptableSpread ?? "Not entered"}</p>
<p class="estimated">Deal confidence score: ${lead.dataConfidenceScore} — not a guarantee</p>

<h2>Assignment / Equitable-Interest Disclosure Placeholder</h2>
<p><em>Contract-interest / assignment workflow — confirm assignability, disclosures, and marketing restrictions with licensed attorney and broker where required. EstateLeadOS does not confirm legal title or ownership.</em></p>

${attorneyNotes}

<h2>Contact Instructions</h2>
<p>Contact the sender to discuss this opportunity. Do not rely on unverified contact enrichment in this packet.</p>

<p style="margin-top:24px;font-size:9pt;color:#888;text-align:center">EstateLeadOS — Powered by SCS Nova · External Distribution v${version}</p>
</body></html>`;

  const attorneyApproved = attorneyReview ? isAttorneyApproved(attorneyReview.reviewStatus) : false;
  let status: DistributionPacketStatus = attorneyApproved ? "attorney_approved" : "needs_attorney_review";
  if (attorneyReview?.manualOverrideAcknowledged) status = "ready_for_user_review";

  const packet: DistributionPacket = {
    id: uid("dp"),
    organizationId: session.organizationId,
    leadId: input.leadId,
    sourcePacketId: input.sourcePacketId ?? null,
    attorneyReviewId: attorneyReview?.id ?? null,
    packetType: input.packetType,
    packetStatus: status,
    packetVersion: version,
    redactionChecklist: REDACTION_CHECKLIST.map((r) => ({ ...r, complete: false })),
    attorneyReviewStatus: attorneyReview?.reviewStatus ?? null,
    userApprovalStatus: "pending",
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
    actionDescription: `${DISTRIBUTION_TYPE_LABELS[input.packetType]} v${version} created (external-facing, redacted)`,
    relatedAttorneyReviewId: attorneyReview?.id,
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
  if (checklist.every((r) => r.complete) && updated.packetStatus === "attorney_approved") {
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
    actionDescription: "Distribution packet approved for external email send",
  });

  return updated;
}

export { DISTRIBUTION_TYPE_LABELS } from "@/lib/types/distribution";
