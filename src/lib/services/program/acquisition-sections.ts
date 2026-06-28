import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { REQUIRED_PACKET_ITEMS } from "@/lib/constants/required-packet-items";
import type { FullLeadDetail } from "@/lib/types/crm";
import type { LeadPacketSection } from "@/lib/types/program";
import { ACQUISITION_PACKET_DISCLAIMER } from "@/lib/types/program";
import type { AssignmentReadiness, RequiredDocument } from "@/lib/types/program";
import type { DealCalculation } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import type { DraftSignatureDocument } from "@/lib/types/program";
import {
  renderAttorneyQuestionsHtml,
  renderDraftDocumentsSectionHtml,
  renderSignatureDraftChecklistHtml,
} from "./draft-signature-builder";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function buildSection(
  packetId: string,
  sectionType: string,
  title: string,
  content: string,
  status: string,
  missing: string[] = [],
  evidenceIds: string[] = []
): LeadPacketSection {
  return {
    id: uid("lps"),
    packetId,
    sectionType,
    sectionTitle: title,
    sectionStatus: status as LeadPacketSection["sectionStatus"],
    sectionContent: content,
    sourceEvidenceIds: evidenceIds,
    missingItems: missing,
    createdAt: now(),
    updatedAt: now(),
  };
}

function findEvidenceByPattern(sources: LeadVerificationBundle["evidenceSources"], pattern: RegExp) {
  return sources.filter(
    (s) =>
      pattern.test(s.sourceType)
      || pattern.test(s.sourceName)
      || pattern.test(s.citationLabel ?? "")
      || pattern.test(s.sourceExcerpt ?? "")
  );
}

export interface AcquisitionSectionInput {
  packetId: string;
  packetTitle: string;
  lead: FullLeadDetail;
  evidence: LeadVerificationBundle | null;
  documents: RequiredDocument[];
  missingItems: RequiredDocument[];
  missingCount: number;
  version: number;
  confidence: number;
  assignmentReadiness?: AssignmentReadiness | null;
  calculation?: DealCalculation | null;
  draftDocuments: DraftSignatureDocument[];
}

export function buildAcquisitionSections(input: AcquisitionSectionInput): LeadPacketSection[] {
  const {
    packetId,
    packetTitle,
    lead,
    evidence,
    documents,
    missingItems,
    missingCount,
    version,
    confidence,
    assignmentReadiness,
    calculation,
    draftDocuments,
  } = input;

  const sections: LeadPacketSection[] = [];
  const sources = evidence?.evidenceSources ?? [];
  const deedEvidence = findEvidenceByPattern(sources, /deed|recorder|transfer|land/i);
  const probateEvidence = findEvidenceByPattern(sources, /probate|estate|wills|court|inherit/i);
  const assessmentEvidence = findEvidenceByPattern(sources, /assessor|assessment|sdat|property|gis|parcel/i);
  const taxEvidence = findEvidenceByPattern(sources, /tax|treasurer|delinquent/i);

  sections.push(
    buildSection(
      packetId,
      "cover",
      "Cover Page",
      `<h1>EstateLeadOS — ${escapeHtml(packetTitle)}</h1>
       <p><strong>Powered by SCS Nova</strong></p>
       <p>Lead: ${escapeHtml(lead.propertyAddress ?? lead.id)}</p>
       <p>County/State: ${escapeHtml(lead.county ?? "—")}, ${escapeHtml(lead.state ?? "—")}</p>
       <p>Packet Version: ${version}</p>
       <p>Generated: ${new Date().toLocaleString()}</p>
       <p>Confidence Score: ${confidence}</p>
       <p class="disclaimer">${escapeHtml(ACQUISITION_PACKET_DISCLAIMER)}</p>
       <p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>`,
      "attached"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "lead_summary",
      "Lead Summary",
      `<p><strong>Address:</strong> ${escapeHtml(lead.propertyAddress ?? "—")}</p>
       <p><strong>Owner:</strong> ${escapeHtml(lead.ownerName ?? "Not confirmed")}</p>
       <p><strong>Lead Type:</strong> ${escapeHtml(lead.primaryLeadType ?? "inherited_property")}</p>
       <p><strong>Pipeline Stage:</strong> ${escapeHtml(lead.pipelineStage ?? "—")}</p>
       <p><strong>Estate Lead Score:</strong> ${lead.estateLeadScore ?? "—"}</p>`,
      "attached"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "property_summary",
      "Property Summary",
      `<p><strong>Parcel:</strong> ${escapeHtml(lead.parcelId ?? "—")}</p>
       <p><strong>Type:</strong> ${escapeHtml(lead.propertyType ?? "—")}</p>
       <p><strong>Beds/Baths:</strong> ${lead.beds ?? "—"} / ${lead.baths ?? "—"}</p>
       <p><strong>Square Feet:</strong> ${lead.squareFeet ?? "—"}</p>
       <p><strong>Year Built:</strong> ${lead.yearBuilt ?? "—"}</p>
       <p><strong>Estimated Value:</strong> ${lead.estimatedValue != null ? `$${lead.estimatedValue.toLocaleString()}` : "—"} (user/system estimate)</p>`,
      lead.propertyAddress ? "attached" : "missing"
    )
  );

  const proofChainHtml =
    evidence?.proofChain?.length
      ? `<ol>${evidence.proofChain
          .map(
            (step) =>
              `<li><strong>${escapeHtml(step.title)}</strong> — ${escapeHtml(step.status)}<br/><em>${escapeHtml(step.description)}</em></li>`
          )
          .join("")}</ol>`
      : "<p>Government proof chain not assembled — run evidence research.</p>";
  sections.push(
    buildSection(
      packetId,
      "government_proof_chain",
      "Government Proof Chain",
      proofChainHtml,
      evidence?.proofChain?.some((s) => s.status === "complete") ? "attached" : "missing",
      [],
      sources.map((s) => s.id)
    )
  );

  const evidenceHtml =
    sources.length
      ? sources
          .map(
            (e) =>
              `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> (${escapeHtml(e.sourceType)})<br/>
               <a href="${escapeHtml(e.sourceUrl ?? "")}">${escapeHtml(e.sourceUrl ?? "")}</a><br/>
               <em>${escapeHtml(e.citationLabel ?? e.sourceExcerpt ?? "")}</em></div>`
          )
          .join("")
      : "<p>No government evidence attached yet.</p>";
  sections.push(
    buildSection(
      packetId,
      "evidence",
      "Evidence Source Citations",
      evidenceHtml,
      sources.length ? "attached" : "missing",
      [],
      sources.map((s) => s.id)
    )
  );

  const assessmentHtml =
    assessmentEvidence.length || lead.taxAssessedValue
      ? `<p><strong>Assessed Value:</strong> ${lead.taxAssessedValue != null ? `$${lead.taxAssessedValue.toLocaleString()}` : "—"}</p>
         ${
           assessmentEvidence.length
             ? assessmentEvidence
                 .map(
                   (e) =>
                     `<div class="citation"><strong>${escapeHtml(e.sourceName)}</strong> — ${escapeHtml(e.citationLabel ?? e.sourceExcerpt ?? "")}</div>`
                 )
                 .join("")
             : "<p>No assessment record citation attached.</p>"
         }`
      : "<p>Property assessment summary not available.</p>";
  sections.push(
    buildSection(
      packetId,
      "property_assessment",
      "Property Assessment Summary",
      assessmentHtml,
      assessmentEvidence.length || lead.taxAssessedValue ? "found" : "missing"
    )
  );

  const taxHtml =
    taxEvidence.length || lead.taxDelinquent != null
      ? `<p><strong>Tax Delinquent Signal:</strong> ${lead.taxDelinquent ? "Yes" : "No"}</p>
         ${
           taxEvidence.length
             ? taxEvidence
                 .map((e) => `<div class="citation">${escapeHtml(e.sourceName)} — ${escapeHtml(e.citationLabel ?? "")}</div>`)
                 .join("")
             : "<p>Tax record citation not attached — check county treasurer.</p>"
         }`
      : "<p>Tax record summary not available for this lead.</p>";
  sections.push(
    buildSection(
      packetId,
      "tax_record",
      "Tax Record Summary",
      taxHtml,
      taxEvidence.length ? "found" : lead.taxDelinquent != null ? "found" : "not_applicable"
    )
  );

  const deedHtml =
    deedEvidence.length || lead.deedType || lead.lastTransferDate
      ? `<p><strong>Deed Type:</strong> ${escapeHtml(lead.deedType ?? "—")}</p>
         <p><strong>Last Transfer:</strong> ${escapeHtml(lead.lastTransferDate ?? "—")}</p>
         <p><strong>Transfer Type:</strong> ${escapeHtml(lead.transferType ?? "—")}</p>
         ${
           deedEvidence.length
             ? deedEvidence.map((e) => `<div class="citation">${escapeHtml(e.sourceName)}</div>`).join("")
             : ""
         }`
      : "<p>Deed / transfer summary not available.</p>";
  sections.push(
    buildSection(
      packetId,
      "deed_transfer",
      "Deed / Transfer Summary",
      deedHtml,
      deedEvidence.length || lead.deedType ? "found" : "missing"
    )
  );

  const probateHtml =
    probateEvidence.length || /estate|probate|inherit/i.test(lead.primaryLeadType ?? "")
      ? `<p><strong>Lead Signal:</strong> ${escapeHtml(lead.primaryLeadType ?? "—")}</p>
         ${
           probateEvidence.length
             ? probateEvidence
                 .map((e) => `<div class="citation">${escapeHtml(e.sourceName)} — ${escapeHtml(e.citationLabel ?? "")}</div>`)
                 .join("")
             : "<p>Estate/probate signal noted — attach official court/register record.</p>"
         }`
      : "<p>No probate / estate signal documented.</p>";
  sections.push(
    buildSection(
      packetId,
      "probate_estate",
      "Probate / Estate Signal Summary",
      probateHtml,
      probateEvidence.length ? "found" : "needs_manual_research"
    )
  );

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
  sections.push(
    buildSection(
      packetId,
      "visuals",
      "Property Visuals",
      visualHtml,
      evidence?.propertyMedia?.length ? "attached" : "missing"
    )
  );

  const contactHtml =
    evidence?.contactCandidates?.length
      ? evidence.contactCandidates
          .map(
            (c) =>
              `<div class="contact"><strong>${escapeHtml(c.contactType)}</strong>: ${escapeHtml(c.contactValue)}
               <br/>Status: ${escapeHtml(c.verificationStatus)} (unverified enrichment — not government proof)</div>`
          )
          .join("")
      : "<p>No contact candidates.</p>";
  sections.push(
    buildSection(
      packetId,
      "contacts",
      "Contact Candidate Sheet",
      contactHtml,
      evidence?.contactCandidates?.length ? "found" : "missing"
    )
  );

  const checklistHtml = `<table class="checklist"><thead><tr><th>Document</th><th>Status</th></tr></thead><tbody>
    ${documents.map((d) => `<tr><td>${escapeHtml(d.documentName)}</td><td>${escapeHtml(d.status)}</td></tr>`).join("")}
  </tbody></table>`;
  sections.push(
    buildSection(
      packetId,
      "checklist",
      "Required Document Checklist",
      checklistHtml,
      missingCount === 0 ? "attached" : "missing",
      missingItems.map((m) => m.documentName)
    )
  );

  const missingHtml =
    missingItems.length > 0
      ? `<ul>${missingItems
          .map(
            (m) =>
              `<li><strong>${escapeHtml(m.documentName)}</strong> — ${escapeHtml(m.whyItMatters ?? "")}<br/>Look next: ${escapeHtml(m.whereToLookNext ?? "")}</li>`
          )
          .join("")}</ul>`
      : "<p>All required documents found or attached.</p>";
  sections.push(
    buildSection(
      packetId,
      "missing",
      "Missing Document Report",
      missingHtml,
      missingItems.length ? "missing" : "attached"
    )
  );

  const complianceItems = REQUIRED_PACKET_ITEMS.filter((i) => i.documentType === "compliance_checklist");
  sections.push(
    buildSection(
      packetId,
      "compliance",
      "Compliance Checklist",
      `<ul>
        <li>☐ State/county compliance profile reviewed</li>
        <li>☐ Outreach rules acknowledged before seller contact</li>
        <li>☐ Assignment disclosure requirements noted</li>
        <li>☐ No unsupported ownership claims in materials</li>
        <li>☐ Manual approval recorded before verification/outreach</li>
      </ul>
      <p><em>${escapeHtml(complianceItems[0]?.whyItMatters ?? "Compliance review required — not legal approval.")}</em></p>`,
      "needs_review"
    )
  );

  const ar = assignmentReadiness;
  const arHtml = ar
    ? `<ul>${ar.checklist.map((c) => `<li>${c.complete ? "✓" : "○"} ${escapeHtml(c.label)}</li>`).join("")}</ul>
       <p>Target Assignment Fee: ${ar.targetAssignmentFee ?? "—"} (user estimate)</p>
       <p>Minimum Spread: ${ar.minimumAcceptableSpread ?? "—"} (user estimate)</p>
       <p><em>Assignment-readiness review only — not legal approval.</em></p>`
    : "<p>Assignment readiness not yet evaluated.</p>";
  sections.push(
    buildSection(
      packetId,
      "assignment_readiness",
      "Assignment Readiness Checklist",
      arHtml,
      ar ? "needs_review" : "not_started"
    )
  );

  const calcHtml = calculation
    ? `<p><strong>Estimated ARV:</strong> $${calculation.estimatedArv.toLocaleString()}</p>
       <p><strong>Repairs:</strong> $${calculation.estimatedRepairs.toLocaleString()}</p>
       <p><strong>Offer Range:</strong> $${calculation.offerRangeLow.toLocaleString()} – $${calculation.offerRangeHigh.toLocaleString()}</p>
       <p><strong>Suggested Seller Offer:</strong> $${calculation.suggestedSellerOffer.toLocaleString()}</p>
       <p><strong>Estimated Spread:</strong> $${calculation.estimatedSpread.toLocaleString()}</p>
       <p><em>User-entered estimates — not guaranteed profit. Confirm with qualified professionals.</em></p>`
    : "<p>No Deal Calculator printout attached. Run Deal Calculator on lead detail.</p>";
  sections.push(
    buildSection(
      packetId,
      "deal_calculator",
      "Deal Calculator Printout",
      calcHtml,
      calculation ? "attached" : "missing"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "attorney_questions",
      "Attorney Questions Sheet",
      renderAttorneyQuestionsHtml(),
      "attached"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "signature_draft_checklist",
      "Signature Draft Checklist",
      renderSignatureDraftChecklistHtml(draftDocuments),
      draftDocuments.some((d) => d.missingFields.length > 0) ? "missing" : "needs_review"
    )
  );

  const auditHtml =
    evidence?.actionLogs?.length
      ? `<ul>${evidence.actionLogs
          .slice(0, 20)
          .map(
            (l) =>
              `<li>${escapeHtml(l.actionType)} — ${escapeHtml(l.actorUserName ?? "")} — ${new Date(l.createdAt).toLocaleString()}</li>`
          )
          .join("")}</ul>`
      : "<p>No audit events recorded.</p>";
  sections.push(
    buildSection(
      packetId,
      "audit",
      "Audit Trail Summary",
      auditHtml,
      evidence?.actionLogs?.length ? "attached" : "missing"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "draft_documents",
      "Draft Documents for Attorney / Title Review",
      renderDraftDocumentsSectionHtml(draftDocuments),
      draftDocuments.some((d) => d.status === "missing_data") ? "missing" : "needs_review"
    )
  );

  sections.push(
    buildSection(
      packetId,
      "disclaimer",
      "Disclaimer",
      `<p>${escapeHtml(GLOBAL_DISCLAIMER)}</p>
       <p>${escapeHtml(ACQUISITION_PACKET_DISCLAIMER)}</p>
       <p><strong>No document in this packet is legally valid or ready to sign without attorney/title review.</strong></p>`,
      "attached"
    )
  );

  return sections;
}

export function isAcquisitionStylePacket(packetType: string): boolean {
  return [
    "acquisition_preparation",
    "attorney_title_review",
    "full_lead_archive",
    "internal_review",
    "seller_review",
    "seller_outreach_prep",
    "assignment_readiness",
  ].includes(packetType);
}
