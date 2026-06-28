import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { ATTORNEY_REVIEW_QUESTIONS } from "@/lib/constants/distribution-templates";
import { ATTORNEY_FEE_WARNING } from "@/lib/types/distribution";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundleSync } from "@/lib/services/verification/bundle-client";
import { getProgramPackets, getRequiredDocuments, getAssignmentReadiness } from "@/lib/services/program/local-store";
import type { AttorneyReview } from "@/lib/types/distribution";
import {
  createAttorneyReview,
  getAttorneyReview,
  saveAttorneyReview,
  logDistributionAudit,
} from "./local-store";
import { ACQUISITION_PACKET_DISCLAIMER } from "@/lib/types/program";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Client-safe attorney review file builder for local preview mode. */
export function buildAttorneyReviewFileClient(leadId: string, packetId?: string): AttorneyReview {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) throw new Error("Lead not found");

  const review = getAttorneyReview(leadId) ?? createAttorneyReview(leadId, packetId);
  const packets = getProgramPackets({ leadId });
  const sourcePacket = packetId ? packets.find((p) => p.id === packetId) : packets[0];
  const docs = getRequiredDocuments(leadId);
  const ar = getAssignmentReadiness(leadId);
  const evidence = getLeadVerificationBundleSync(leadId, {
    propertyAddress: lead.propertyAddress ?? "",
    ownerName: lead.ownerName,
    parcelId: lead.parcelId,
  });

  const questionsHtml = `<ol>${ATTORNEY_REVIEW_QUESTIONS.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>`;
  const evidenceHtml =
    evidence?.evidenceSources?.length
      ? evidence.evidenceSources
          .map(
            (e) =>
              `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> — ${escapeHtml(e.sourceUrl ?? "")}<br/><em>${escapeHtml(e.citationLabel ?? e.sourceExcerpt ?? "")}</em></div>`
          )
          .join("")
      : "<p>No government evidence attached.</p>";

  const missingHtml = docs
    .filter((d) => ["missing", "needs_manual_research"].includes(d.status))
    .map((d) => `<li>${escapeHtml(d.documentName)} — ${escapeHtml(d.whyItMatters ?? "")}</li>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Attorney Review File — ${escapeHtml(lead.propertyAddress)}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111;font-size:11pt}
h1{font-size:18pt;border-bottom:2px solid #333}h2{font-size:13pt;margin-top:20px}
.disclaimer,.warning{font-size:9pt;border-left:3px solid #c9a227;padding-left:8px;color:#555;margin:12px 0}
.citation{margin:8px 0;padding:8px;background:#f8f8f8;font-size:10pt}
.section{margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:12px}
.nova{text-align:center;font-size:9pt;color:#888;margin-top:24px}
</style></head><body>
<h1>Attorney Review File</h1>
<p><strong>EstateLeadOS — Powered by SCS Nova</strong></p>
<p>Lead: ${escapeHtml(lead.propertyAddress)} · ${escapeHtml(lead.county)}, ${escapeHtml(lead.state)}</p>
<p>Generated: ${new Date().toLocaleString()} by ${escapeHtml(session.userName)}</p>
<p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>
<p class="disclaimer">${escapeHtml(ACQUISITION_PACKET_DISCLAIMER)}</p>
<p class="warning">${escapeHtml(ATTORNEY_FEE_WARNING)}</p>

<div class="section"><h2>Lead Summary</h2>
<p><strong>Owner:</strong> ${escapeHtml(lead.ownerName ?? "Not confirmed")}</p>
<p><strong>Lead Type:</strong> ${escapeHtml(lead.primaryLeadType)}</p>
<p><strong>Confidence:</strong> ${lead.dataConfidenceScore}</p></div>

<div class="section"><h2>Government Proof Chain & Citations</h2>${evidenceHtml}</div>

<div class="section"><h2>Missing Documents Report</h2>
${missingHtml ? `<ul>${missingHtml}</ul>` : "<p>No missing documents flagged.</p>"}</div>

<div class="section"><h2>Assignment-Readiness Summary</h2>
<p>Status: ${escapeHtml(ar?.status ?? "not_started")}</p>
<p>Target Assignment Fee: ${ar?.targetAssignmentFee ?? "—"} (user-entered assumption)</p>
<p>Minimum Spread: ${ar?.minimumAcceptableSpread ?? "—"} (user-entered assumption)</p>
<p><em>Not legal approval. Professional review recommended.</em></div>

<div class="section"><h2>Questions for Attorney</h2>${questionsHtml}
<p><em>EstateLeadOS generates review questions only — not legal conclusions.</em></p></div>

<div class="section"><h2>Draft Documents Notice</h2>
<p>All signature documents remain drafts until reviewed by a qualified attorney or title company.</p></div>

<div class="section"><h2>Attorney Notes Section</h2>
<p>_____________________________________________</p>
<p>_____________________________________________</p></div>

<div class="section"><h2>Attorney Approval Section</h2>
<p>Status: ____________________ Date: __________</p>
<p>Signature / Acknowledgement: ____________________</p></div>

<p class="nova">EstateLeadOS — Powered by SCS Nova</p>
</body></html>`;

  const updated: AttorneyReview = {
    ...review,
    packetId: sourcePacket?.id ?? review.packetId,
    attorneyReviewFileHtml: html,
    reviewStatus: "packet_ready_for_attorney",
    reviewRequestedAt: review.reviewRequestedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveAttorneyReview(updated);
  logDistributionAudit({
    leadId,
    packetId: sourcePacket?.id,
    actionType: "attorney_review_file_created",
    actionDescription: "Attorney Review File generated for manual delivery to attorney",
    relatedAttorneyReviewId: updated.id,
  });

  return updated;
}
