import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  DRAFT_FIELD_LABELS,
  DRAFT_SIGNATURE_TEMPLATES,
  deriveDraftDocumentStatus,
} from "@/lib/constants/draft-signature-documents";
import { ATTORNEY_REVIEW_QUESTIONS } from "@/lib/constants/distribution-templates";
import { getSessionContext } from "@/lib/config/session";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLatestCalculation } from "@/lib/services/deal-calculator";
import { getAssignmentReadiness } from "./local-store";
import { getLeadVerificationBundleSync } from "@/lib/services/verification/bundle-client";
import type { DraftSignatureDocument } from "@/lib/types/program";
import {
  ACQUISITION_PACKET_DISCLAIMER,
  DRAFT_SIGNATURE_REVIEW_LABEL,
} from "@/lib/types/program";
import { saveDraftSignatureDocuments } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function val(value: string | number | null | undefined, placeholder = "_______________"): string {
  if (value === null || value === undefined || value === "") return `<span class="missing">${placeholder}</span>`;
  return escapeHtml(String(value));
}

interface LeadFieldContext {
  propertyAddress: string;
  ownerName: string;
  mailingAddress: string;
  parcelId: string;
  county: string;
  state: string;
  propertyType: string;
  representativeName: string;
  governmentCitation: string;
  offerRange: string;
  offerAmount: string;
  estimatedArv: string;
  estimatedRepairs: string;
  targetAssignmentFee: string;
  sellerContact: string;
}

function buildFieldContext(leadId: string): { ctx: LeadFieldContext; missingByField: Record<string, boolean> } {
  const lead = getFullLeadByIdSync(leadId);
  const evidence = getLeadVerificationBundleSync(leadId, {
    propertyAddress: lead?.propertyAddress ?? "",
    ownerName: lead?.ownerName,
    parcelId: lead?.parcelId,
  });
  const calc = getLatestCalculation(leadId);
  const ar = getAssignmentReadiness(leadId);
  const rep = evidence?.persons?.find((p) =>
    /representative|executor|heir/i.test(p.connectionRationale ?? p.roleLabel ?? "")
  );
  const topCitation = evidence?.evidenceSources?.[0];
  const contact = evidence?.contactCandidates?.[0];

  const ctx: LeadFieldContext = {
    propertyAddress: lead?.propertyAddress ?? "",
    ownerName: lead?.ownerName ?? "",
    mailingAddress: lead?.mailingAddress ?? "",
    parcelId: lead?.parcelId ?? "",
    county: lead?.county ?? "",
    state: lead?.state ?? "",
    propertyType: lead?.propertyType ?? "",
    representativeName: rep?.personName ?? lead?.possibleHeirName ?? "",
    governmentCitation: topCitation?.citationLabel ?? topCitation?.sourceName ?? "",
    offerRange: calc ? `$${calc.offerRangeLow.toLocaleString()} – $${calc.offerRangeHigh.toLocaleString()}` : "",
    offerAmount: calc ? String(calc.suggestedSellerOffer) : "",
    estimatedArv: calc ? String(calc.estimatedArv) : "",
    estimatedRepairs: calc ? String(calc.estimatedRepairs) : "",
    targetAssignmentFee: ar?.targetAssignmentFee != null ? String(ar.targetAssignmentFee) : "",
    sellerContact: contact?.contactValue ?? "",
  };

  const missingByField: Record<string, boolean> = {
    property_address: !ctx.propertyAddress,
    owner_name: !ctx.ownerName,
    seller_contact: !ctx.sellerContact,
    mailing_address: !ctx.mailingAddress,
    parcel_id: !ctx.parcelId,
    county: !ctx.county,
    state: !ctx.state,
    property_type: !ctx.propertyType,
    representative_name: !ctx.representativeName,
    government_evidence_citation: !ctx.governmentCitation,
    purchase_intent_summary: !ctx.propertyAddress,
    offer_range: !ctx.offerRange,
    offer_amount: !ctx.offerAmount,
    estimated_arv: !ctx.estimatedArv,
    estimated_repairs: !ctx.estimatedRepairs,
    contract_assignability_notes: !ctx.state,
    disclosure_requirements_acknowledged: true,
    buyer_name: true,
    disclosure_language_reviewed: true,
    attorney_name: true,
    review_date: true,
    title_company_name: true,
    target_assignment_fee: !ctx.targetAssignmentFee,
    fee_structure_notes: !ctx.targetAssignmentFee,
    attorney_approval_status: true,
    documents_ready_for_signature: true,
  };

  return { ctx, missingByField };
}

function renderDraftHeader(title: string): string {
  return `
    <div class="draft-banner"><strong>${escapeHtml(DRAFT_SIGNATURE_REVIEW_LABEL)}</strong></div>
    <h1>${escapeHtml(title)}</h1>
    <p><strong>EstateLeadOS — Powered by SCS Nova</strong></p>
    <p class="disclaimer">${escapeHtml(ACQUISITION_PACKET_DISCLAIMER)}</p>
    <p class="disclaimer">${escapeHtml(GLOBAL_DISCLAIMER)}</p>
  `;
}

function renderDocumentBody(
  documentType: string,
  ctx: LeadFieldContext,
  missingFields: string[]
): string {
  const missingList =
    missingFields.length > 0
      ? `<div class="missing-fields"><strong>Missing fields:</strong><ul>${missingFields
          .map((f) => `<li>${escapeHtml(DRAFT_FIELD_LABELS[f] ?? f)}</li>`)
          .join("")}</ul></div>`
      : "";

  const bodies: Record<string, string> = {
    seller_intake_form: `
      ${renderDraftHeader("Seller Intake Form")}
      <p>Property: ${val(ctx.propertyAddress)}</p>
      <p>Owner: ${val(ctx.ownerName)}</p>
      <p>Mailing Address: ${val(ctx.mailingAddress)}</p>
      <p>Contact: ${val(ctx.sellerContact)}</p>
      <p>Seller Statement: _______________________________________________</p>
      ${missingList}
    `,
    property_information_sheet: `
      ${renderDraftHeader("Property Information Sheet")}
      <p>Address: ${val(ctx.propertyAddress)}</p>
      <p>Parcel: ${val(ctx.parcelId)}</p>
      <p>County / State: ${val(ctx.county)}, ${val(ctx.state)}</p>
      <p>Property Type: ${val(ctx.propertyType)}</p>
      ${missingList}
    `,
    owner_representative_verification: `
      ${renderDraftHeader("Owner / Representative Verification Sheet")}
      <p>Owner of Record: ${val(ctx.ownerName)}</p>
      <p>Possible Representative: ${val(ctx.representativeName)}</p>
      <p>Government Citation: ${val(ctx.governmentCitation)}</p>
      <p>Verification Notes: _______________________________________________</p>
      ${missingList}
    `,
    purchase_intent_worksheet: `
      ${renderDraftHeader("Purchase Intent Worksheet")}
      <p>Property: ${val(ctx.propertyAddress)}</p>
      <p>Intent Summary: User-entered purchase interest for professional review only.</p>
      <p>Offer Range (estimate): ${val(ctx.offerRange)}</p>
      ${missingList}
    `,
    offer_worksheet: `
      ${renderDraftHeader("Offer Worksheet")}
      <p>Property: ${val(ctx.propertyAddress)}</p>
      <p>Suggested Offer (estimate): ${val(ctx.offerAmount)}</p>
      <p>Estimated ARV: ${val(ctx.estimatedArv)}</p>
      <p>Estimated Repairs: ${val(ctx.estimatedRepairs)}</p>
      <p><em>Financial figures are user-entered estimates — not guarantees.</em></p>
      ${missingList}
    `,
    assignability_review_checklist: `
      ${renderDraftHeader("Assignability Review Checklist")}
      <p>Jurisdiction: ${val(ctx.county)}, ${val(ctx.state)}</p>
      <ul>
        <li>☐ Contract assignability language reviewed by attorney</li>
        <li>☐ State assignment restrictions reviewed</li>
        <li>☐ County/title requirements reviewed</li>
        <li>☐ Equitable interest disclosure reviewed</li>
      </ul>
      ${missingList}
    `,
    assignment_disclosure_checklist: `
      ${renderDraftHeader("Assignment Disclosure Checklist")}
      <p>State: ${val(ctx.state)}</p>
      <ul>
        <li>☐ Seller disclosure requirements identified</li>
        <li>☐ Buyer/assignee disclosure requirements identified</li>
        <li>☐ Marketing restrictions reviewed</li>
        <li>☐ No unsupported claims in outreach materials</li>
      </ul>
      ${missingList}
    `,
    buyer_assignee_disclosure_checklist: `
      ${renderDraftHeader("Buyer / Assignee Disclosure Checklist")}
      <p>Buyer / Assignee: ${val(undefined)}</p>
      <ul>
        <li>☐ Opportunity review disclaimer included</li>
        <li>☐ No ownership/title guarantees stated</li>
        <li>☐ Assignment fee structure disclosed for review</li>
        <li>☐ Proof-of-funds requirements noted</li>
      </ul>
      ${missingList}
    `,
    attorney_review_acknowledgement: `
      ${renderDraftHeader("Attorney Review Acknowledgement")}
      <p>Attorney: ${val(undefined)}</p>
      <p>Review Date: ${val(undefined)}</p>
      <p>Acknowledgement: Materials reviewed — not legal approval until attorney signs.</p>
      ${missingList}
    `,
    title_company_intake_sheet: `
      ${renderDraftHeader("Title Company Intake Sheet")}
      <p>Property: ${val(ctx.propertyAddress)}</p>
      <p>Parcel: ${val(ctx.parcelId)}</p>
      <p>Title Company: ${val(undefined)}</p>
      ${missingList}
    `,
    fee_agreement_tracking_sheet: `
      ${renderDraftHeader("Fee Agreement Tracking Sheet")}
      <p>Target Assignment Fee (user estimate): ${val(ctx.targetAssignmentFee)}</p>
      <p>Fee Structure Notes: _______________________________________________</p>
      <p><em>${escapeHtml("Not legal approval. Confirm compensation structure with attorney.")}</em></p>
      ${missingList}
    `,
    final_signing_checklist: `
      ${renderDraftHeader("Final Signing Checklist")}
      <ul>
        <li>☐ Attorney approved all signature documents</li>
        <li>☐ Title company requirements satisfied</li>
        <li>☐ All missing fields resolved</li>
        <li>☐ No document presented as legally valid without review</li>
        <li>☐ Signed copies uploaded to archive</li>
      </ul>
      ${missingList}
    `,
  };

  return bodies[documentType] ?? `${renderDraftHeader(documentType)}<p>Template placeholder.</p>${missingList}`;
}

export function generateDraftSignatureDocuments(input: {
  leadId: string;
  packetId?: string | null;
}): DraftSignatureDocument[] {
  const session = getSessionContext();
  const { ctx, missingByField } = buildFieldContext(input.leadId);
  const ts = now();

  const documents = DRAFT_SIGNATURE_TEMPLATES.map((template) => {
    const missingFields = template.requiredFields.filter((field) => missingByField[field]);
    const status = deriveDraftDocumentStatus(missingFields);
    const generatedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:24px;color:#111;font-size:11pt}
      .draft-banner{background:#fef3cd;border:2px solid #c9a227;padding:12px;margin-bottom:16px;font-size:10pt}
      .disclaimer{font-size:9pt;color:#555;border-left:3px solid #c9a227;padding-left:8px;margin:12px 0}
      .missing{color:#b45309;font-style:italic}
      .missing-fields{background:#fff7ed;border:1px solid #fdba74;padding:8px;margin-top:12px;font-size:10pt}
      h1{font-size:16pt;border-bottom:1px solid #333}
    </style></head><body>
    ${renderDocumentBody(template.documentType, ctx, missingFields)}
    <p style="text-align:center;font-size:9pt;color:#888;margin-top:24px">EstateLeadOS — Powered by SCS Nova</p>
    </body></html>`;

    return {
      id: uid("dsd"),
      organizationId: session.organizationId,
      leadId: input.leadId,
      packetId: input.packetId ?? null,
      documentName: template.documentName,
      documentType: template.documentType,
      status,
      templateVersion: template.templateVersion,
      requiredFields: template.requiredFields,
      missingFields,
      generatedHtml,
      pdfUrl: null,
      attorneyReviewRequired: template.attorneyReviewRequired,
      signatureRequired: template.signatureRequired,
      signedFileUrl: null,
      createdAt: ts,
      updatedAt: ts,
    } satisfies DraftSignatureDocument;
  });

  return saveDraftSignatureDocuments(documents);
}

export function renderDraftDocumentsSectionHtml(documents: DraftSignatureDocument[]): string {
  const items = documents
    .map(
      (d) =>
        `<div class="draft-doc">
          <h3>${escapeHtml(d.documentName)}</h3>
          <p class="draft-label"><strong>${escapeHtml(DRAFT_SIGNATURE_REVIEW_LABEL)}</strong></p>
          <p>Status: ${escapeHtml(d.status)} · Missing fields: ${d.missingFields.length}</p>
          ${
            d.missingFields.length
              ? `<ul>${d.missingFields.map((f) => `<li>${escapeHtml(DRAFT_FIELD_LABELS[f] ?? f)}</li>`).join("")}</ul>`
              : "<p>All required fields populated from lead data.</p>"
          }
        </div>`
    )
    .join("");

  return `
    <section class="draft-documents-section">
      <h2>Draft Documents for Attorney / Title Review</h2>
      <p class="draft-banner"><strong>${escapeHtml(DRAFT_SIGNATURE_REVIEW_LABEL)}</strong></p>
      <p>${escapeHtml(ACQUISITION_PACKET_DISCLAIMER)}</p>
      ${items}
    </section>
  `;
}

export function renderSignatureDraftChecklistHtml(documents: DraftSignatureDocument[]): string {
  return `
    <ul>
      ${documents
        .map(
          (d) =>
            `<li>${d.missingFields.length === 0 ? "☑" : "☐"} ${escapeHtml(d.documentName)} — ${escapeHtml(d.status)}${
              d.missingFields.length ? ` (${d.missingFields.length} missing field(s))` : ""
            }</li>`
        )
        .join("")}
    </ul>
    <p><em>Checklist tracks draft readiness only — not legal approval or signature readiness.</em></p>
  `;
}

export function renderAttorneyQuestionsHtml(): string {
  return `<ol>${ATTORNEY_REVIEW_QUESTIONS.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>
    <p><em>EstateLeadOS generates review questions only — not legal conclusions.</em></p>`;
}
