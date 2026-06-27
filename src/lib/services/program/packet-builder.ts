import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { PACKET_TYPE_LABELS, BUYER_PACKET_WARNING } from "@/lib/types/program";
import type {
  AssignmentReadiness,
  LeadPacket,
  LeadPacketSection,
  LeadPacketStatus,
  LeadPacketType,
  RequiredDocument,
} from "@/lib/types/program";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import { getNextPacketVersion, saveProgramPacket } from "./local-store";
import { getRequiredDocuments } from "./local-store";
import { runDocumentFinder } from "./document-finder";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sectionHtml(title: string, content: string, status: string): string {
  return `<section class="packet-section"><h2>${escapeHtml(title)}</h2><p class="section-status">Status: ${escapeHtml(status)}</p><div class="section-body">${content}</div></section>`;
}

function buildSection(
  packetId: string,
  sectionType: string,
  title: string,
  content: string,
  status: string,
  missing: string[] = []
): LeadPacketSection {
  return {
    id: uid("lps"),
    packetId,
    sectionType,
    sectionTitle: title,
    sectionStatus: status as LeadPacketSection["sectionStatus"],
    sectionContent: content,
    sourceEvidenceIds: [],
    missingItems: missing,
    createdAt: now(),
    updatedAt: now(),
  };
}

function derivePacketStatus(
  packetType: LeadPacketType,
  missingCount: number,
  complianceBlocked: boolean,
  manuallyApproved: boolean
): LeadPacketStatus {
  if (complianceBlocked) return "compliance_blocked";
  if (missingCount > 0) return "missing_documents";
  if (packetType === "buyer_investor_opportunity") return "ready_for_buyer_review";
  if (packetType === "assignment_readiness") return "assignment_review_ready";
  if (packetType === "seller_outreach_prep") return manuallyApproved ? "ready_for_seller_outreach_review" : "review_needed";
  if (packetType === "attorney_title_review") return "review_needed";
  return "ready_for_internal_review";
}

export async function buildLeadPacket(input: {
  leadId: string;
  packetType: LeadPacketType;
  assignmentReadiness?: AssignmentReadiness | null;
}): Promise<LeadPacket> {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(input.leadId);
  if (!lead) throw new Error("Lead not found");

  const { documents, missingCount } = await runDocumentFinder(input.leadId);
  let evidence = null;
  try {
    evidence = await getLeadVerificationBundle(input.leadId);
  } catch {
    evidence = null;
  }

  const packetId = uid("lp");
  const version = getNextPacketVersion(input.leadId, input.packetType);
  const confidence = lead.dataConfidenceScore ?? (evidence?.evidenceSources?.length ? 55 : 0);
  const manuallyApproved = evidence?.persons?.some((p) => p.verificationStatus === "manually_approved") ?? false;

  const sections: LeadPacketSection[] = [];
  const missingItems = documents.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload"].includes(d.status)
  );

  // Cover page
  const coverContent = `
    <h1>EstateLeadOS — ${escapeHtml(PACKET_TYPE_LABELS[input.packetType])}</h1>
    <p><strong>Powered by SCS Nova</strong></p>
    <p>Lead: ${escapeHtml(lead.propertyAddress ?? lead.id)}</p>
    <p>County/State: ${escapeHtml(lead.county ?? "—")}, ${escapeHtml(lead.state ?? "—")}</p>
    <p>Packet Version: ${version}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Confidence Score: ${confidence}</p>
    <p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>
  `;
  sections.push(buildSection(packetId, "cover", "Cover Page", coverContent, "attached"));

  // Lead summary
  sections.push(
    buildSection(
      packetId,
      "lead_summary",
      "Lead Summary",
      `<p><strong>Address:</strong> ${escapeHtml(lead.propertyAddress ?? "—")}</p>
       <p><strong>Owner:</strong> ${escapeHtml(lead.ownerName ?? "Not confirmed")}</p>
       <p><strong>Lead Type:</strong> ${escapeHtml(lead.primaryLeadType ?? "inherited_property")}</p>
       <p><strong>Pipeline Stage:</strong> ${escapeHtml(lead.pipelineStage ?? "—")}</p>`,
      "attached"
    )
  );

  // Evidence citations
  const evidenceHtml =
    evidence?.evidenceSources?.length
      ? evidence.evidenceSources
          .map(
            (e) =>
              `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> (${escapeHtml(e.sourceType)})<br/>
               <a href="${escapeHtml(e.sourceUrl ?? "")}">${escapeHtml(e.sourceUrl ?? "")}</a><br/>
               <em>${escapeHtml(e.citationLabel ?? e.sourceExcerpt ?? "")}</em></div>`
          )
          .join("")
      : "<p>No government evidence attached yet.</p>";
  sections.push(buildSection(packetId, "evidence", "Government Source Citations", evidenceHtml, evidence?.evidenceSources?.length ? "attached" : "missing"));

  // Property visuals
  const visualHtml =
    evidence?.propertyMedia?.length
      ? evidence.propertyMedia
          .map(
            (m) =>
              `<div class="visual"><img src="${escapeHtml(m.mediaUrl ?? "")}" alt="${escapeHtml(m.attribution ?? "Property visual")}" style="max-width:100%"/>
               <p><em>Attribution: ${escapeHtml(m.attribution ?? "Official source")}</em></p></div>`
          )
          .join("")
      : "<p>No property visual attached.</p>";
  sections.push(buildSection(packetId, "visuals", "Property Visuals", visualHtml, evidence?.propertyMedia?.length ? "attached" : "missing"));

  // Contact candidates
  const contactHtml =
    evidence?.contactCandidates?.length
      ? evidence.contactCandidates
          .map(
            (c) =>
              `<div class="contact"><strong>${escapeHtml(c.contactType)}</strong>: ${escapeHtml(c.contactValue)}
               <br/>Status: ${escapeHtml(c.verificationStatus)} (unverified enrichment cannot verify lead)</div>`
          )
          .join("")
      : "<p>No contact candidates.</p>";
  sections.push(buildSection(packetId, "contacts", "Contact Candidates", contactHtml, "found"));

  // Document checklist
  const checklistHtml = renderDocumentChecklist(documents);
  sections.push(buildSection(packetId, "checklist", "Document Checklist", checklistHtml, missingCount === 0 ? "attached" : "missing", missingItems.map((m) => m.documentName)));

  // Missing documents report
  const missingHtml =
    missingItems.length > 0
      ? `<ul>${missingItems.map((m) => `<li><strong>${escapeHtml(m.documentName)}</strong> — ${escapeHtml(m.whyItMatters ?? "")}<br/>Look next: ${escapeHtml(m.whereToLookNext ?? "")}</li>`).join("")}</ul>`
      : "<p>All required documents found or attached.</p>";
  sections.push(buildSection(packetId, "missing", "Missing Documents Report", missingHtml, missingItems.length ? "missing" : "attached"));

  // Assignment readiness (if applicable)
  if (input.packetType === "assignment_readiness" || input.packetType === "full_lead_archive") {
    const ar = input.assignmentReadiness;
    const arHtml = ar
      ? `<ul>${ar.checklist.map((c) => `<li>${c.complete ? "✓" : "○"} ${escapeHtml(c.label)}</li>`).join("")}</ul>
         <p>Target Assignment Fee: ${ar.targetAssignmentFee ?? "—"}</p>
         <p>Minimum Spread: ${ar.minimumAcceptableSpread ?? "—"}</p>
         <p><em>Assignment-readiness review only — not legal approval. Professional review recommended.</em></p>`
      : "<p>Assignment readiness not yet evaluated.</p>";
    sections.push(buildSection(packetId, "assignment", "Assignment Readiness", arHtml, ar ? "needs_review" : "not_started"));
  }

  // Buyer packet warning
  if (input.packetType === "buyer_investor_opportunity") {
    sections.push(
      buildSection(
        packetId,
        "buyer_warning",
        "Buyer Review Warning",
        `<p class="warning">${escapeHtml(BUYER_PACKET_WARNING)}</p>
         <p>Confirmed facts are cited from government sources. Estimates and user-entered values are marked separately.</p>`,
        "attached"
      )
    );
  }

  // Audit trail
  const auditHtml =
    evidence?.actionLogs?.length
      ? `<ul>${evidence.actionLogs.slice(0, 20).map((l) => `<li>${escapeHtml(l.actionType)} — ${escapeHtml(l.actorUserName ?? "")} — ${new Date(l.createdAt).toLocaleString()}</li>`).join("")}</ul>`
      : "<p>No audit events recorded.</p>";
  sections.push(buildSection(packetId, "audit", "Audit Trail Summary", auditHtml, evidence?.actionLogs?.length ? "attached" : "missing"));

  sections.push(
    buildSection(packetId, "disclaimer", "Disclaimer", `<p>${escapeHtml(GLOBAL_DISCLAIMER)}</p>`, "attached")
  );

  const printableHtml = renderPrintableHtml(PACKET_TYPE_LABELS[input.packetType], sections, lead.propertyAddress ?? lead.id);

  const packet: LeadPacket = {
    id: packetId,
    organizationId: session.organizationId,
    leadId: input.leadId,
    packetType: input.packetType,
    packetStatus: derivePacketStatus(input.packetType, missingCount, false, manuallyApproved),
    packetVersion: version,
    generatedBy: session.userName,
    generatedAt: now(),
    archivedAt: null,
    printableHtml,
    pdfUrl: null,
    archiveUrl: `/archive?packet=${packetId}`,
    confidenceScore: confidence,
    verificationStatus: manuallyApproved ? "manually_approved" : "pending_review",
    complianceStatus: missingCount > 0 ? "incomplete" : "review_needed",
    assignmentReadinessStatus: input.assignmentReadiness?.status ?? "not_started",
    buyerReviewStatus: input.packetType === "buyer_investor_opportunity" ? "pending_manual_share" : "not_started",
    payoutReadinessStatus: "not_started",
    notes: null,
    sections,
    createdAt: now(),
    updatedAt: now(),
  };

  return saveProgramPacket(packet);
}

function renderDocumentChecklist(documents: RequiredDocument[]): string {
  return `<table class="checklist"><thead><tr><th>Document</th><th>Status</th></tr></thead><tbody>
    ${documents
      .map(
        (d) =>
          `<tr><td>${escapeHtml(d.documentName)}</td><td>${escapeHtml(d.status)}</td></tr>`
      )
      .join("")}
  </tbody></table>`;
}

function renderPrintableHtml(title: string, sections: LeadPacketSection[], address: string): string {
  const styles = `
    @media print { .no-print { display: none; } body { font-family: Georgia, serif; font-size: 11pt; } }
    body { max-width: 800px; margin: 0 auto; padding: 24px; color: #111; }
    h1 { font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 13pt; margin-top: 20px; color: #333; }
    .packet-section { page-break-inside: avoid; margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
    .section-status { font-size: 9pt; color: #666; }
    .disclaimer, .warning { font-size: 9pt; color: #555; border-left: 3px solid #c9a227; padding-left: 8px; margin: 12px 0; }
    .citation { margin: 8px 0; padding: 8px; background: #f8f8f8; font-size: 10pt; }
    .checklist { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .checklist th, .checklist td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
    .nova-brand { font-size: 9pt; color: #888; text-align: center; margin-top: 24px; }
  `;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)} — ${escapeHtml(address)}</title>
    <style>${styles}</style></head><body>
    ${sections.map((s) => s.sectionContent.startsWith("<section") ? s.sectionContent : sectionHtml(s.sectionTitle, s.sectionContent, s.sectionStatus)).join("")}
    <p class="nova-brand">EstateLeadOS — Powered by SCS Nova</p>
    </body></html>`;
}

export function getPacketTypes(): LeadPacketType[] {
  return [
    "internal_review",
    "seller_outreach_prep",
    "buyer_investor_opportunity",
    "assignment_readiness",
    "attorney_title_review",
    "full_lead_archive",
  ];
}
