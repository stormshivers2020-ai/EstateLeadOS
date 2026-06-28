import { getSessionContext } from "@/lib/config/session";
import {
  GOVERNMENT_PROOF_DOCUMENT_TYPES,
  REQUIRED_PACKET_ITEMS,
  type RequiredPacketItemDefinition,
} from "@/lib/constants/required-packet-items";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundleSync } from "@/lib/services/verification/bundle-client";
import type { EvidenceSource, LeadVerificationBundle } from "@/lib/types/verification";
import { getDocuments } from "@/lib/services/documents";
import type { RequiredDocument, RequiredDocumentStatus } from "@/lib/types/program";
import { saveRequiredDocuments, getRequiredDocuments } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function hasEvidenceType(sources: EvidenceSource[], pattern: RegExp): boolean {
  return sources.some(
    (s) =>
      pattern.test(s.sourceType ?? "")
      || pattern.test(s.sourceName ?? "")
      || pattern.test(s.citationLabel ?? ""),
  );
}

function findMatchingEvidence(sources: EvidenceSource[], pattern: RegExp): EvidenceSource | null {
  return sources.find(
    (s) =>
      pattern.test(s.sourceType ?? "")
      || pattern.test(s.sourceName ?? "")
      || pattern.test(s.citationLabel ?? ""),
  ) ?? null;
}

function linkEvidence(row: RequiredDocument, evidence: EvidenceSource | null): RequiredDocument {
  if (!evidence) return row;
  return {
    ...row,
    evidenceSourceId: evidence.id,
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl ?? null,
  };
}

function resolveStatusAndEvidence(
  itemType: string,
  evidence: LeadVerificationBundle | null,
  docs: ReturnType<typeof getDocuments>,
  leadApproved: boolean,
): { status: RequiredDocumentStatus; evidence: EvidenceSource | null } {
  const sources = evidence?.evidenceSources ?? [];
  const media = evidence?.propertyMedia ?? [];
  const contacts = evidence?.contactCandidates ?? [];
  const persons = evidence?.persons ?? [];
  const proofChain = evidence?.proofChain ?? [];

  switch (itemType) {
    case "lead_summary":
      return {
        status: evidence ? "attached" : "missing",
        evidence: sources[0] ?? null,
      };
    case "property_research_sheet":
      return {
        status: evidence?.recordHits?.length ? "found" : "needs_manual_research",
        evidence: findMatchingEvidence(sources, /assessor|property|gis|parcel/i),
      };
    case "government_evidence_sheet": {
      const ev = sources.find((s) => !/people.?search|zillow|realtor/i.test(s.sourceName)) ?? sources[0];
      return { status: sources.length > 0 ? "attached" : "missing", evidence: ev ?? null };
    }
    case "probate_estate_sheet": {
      const ev = findMatchingEvidence(sources, /probate|estate|wills|court|inherit/i);
      return { status: ev ? "found" : "needs_manual_research", evidence: ev };
    }
    case "property_assessment": {
      const ev = findMatchingEvidence(sources, /assessor|assessment|sdat|property/i);
      return { status: ev ? "found" : "needs_manual_research", evidence: ev };
    }
    case "tax_record": {
      const ev = findMatchingEvidence(sources, /tax/i);
      return { status: ev ? "found" : "not_applicable", evidence: ev };
    }
    case "deed_transfer_check": {
      const ev = findMatchingEvidence(sources, /deed|transfer|land|recorder/i);
      return { status: ev ? "found" : "needs_manual_research", evidence: ev };
    }
    case "gis_parcel_visual":
      return {
        status: media.some((m) => /gis|parcel|map/i.test(m.mediaType ?? "")) ? "attached" : "missing",
        evidence: null,
      };
    case "property_visual":
      return { status: media.length > 0 ? "attached" : "missing", evidence: null };
    case "responsible_party_sheet":
      return {
        status:
          persons.length > 0 || sources.some((s) => /representative|decedent|heir|executor/i.test(s.sourceExcerpt ?? ""))
            ? "found"
            : "needs_manual_research",
        evidence: findMatchingEvidence(sources, /probate|estate|representative/i),
      };
    case "contact_candidate_sheet":
      return {
        status: contacts.length > 0 ? "found" : "not_applicable",
        evidence: null,
      };
    case "source_citation_sheet":
      return {
        status: sources.length > 0 ? "attached" : "missing",
        evidence: sources[0] ?? null,
      };
    case "compliance_checklist":
      return {
        status: docs.some((d) => d.documentCategory === "compliance_documents") ? "found" : "needs_review",
        evidence: null,
      };
    case "outreach_readiness":
      return { status: "needs_review", evidence: null };
    case "assignment_readiness":
      return { status: "needs_review", evidence: null };
    case "buyer_opportunity_sheet":
      return { status: "not_started", evidence: null };
    case "deal_calculator_printout":
      return { status: "needs_manual_research", evidence: null };
    case "missing_documents_report":
      return { status: "attached", evidence: null };
    case "manual_approval_record": {
      const manualStep = proofChain.find((s) => s.kind === "manual_review");
      const approved =
        leadApproved
        || persons.some((p) => p.verificationStatus === "manually_approved")
        || manualStep?.status === "complete";
      return { status: approved ? "approved" : "needs_review", evidence: null };
    }
    case "audit_trail_summary":
      return {
        status: (evidence?.actionLogs?.length ?? 0) > 0 ? "attached" : "missing",
        evidence: null,
      };
    case "final_review_cover":
      return { status: "attached", evidence: null };
    default:
      return { status: "not_started", evidence: null };
  }
}

function buildDocumentRow(
  item: RequiredPacketItemDefinition,
  evidence: LeadVerificationBundle | null,
  docs: ReturnType<typeof getDocuments>,
  prior: RequiredDocument | undefined,
  session: ReturnType<typeof getSessionContext>,
  leadId: string,
  leadApproved: boolean,
): RequiredDocument {
  const { status, evidence: matched } = resolveStatusAndEvidence(
    item.documentType,
    evidence,
    docs,
    leadApproved,
  );
  const row: RequiredDocument = {
    id: prior?.id ?? uid("rd"),
    organizationId: session.organizationId,
    leadId,
    documentType: item.documentType,
    documentName: item.documentName,
    status,
    sourceName: prior?.sourceName ?? null,
    sourceUrl: prior?.sourceUrl ?? null,
    evidenceSourceId: prior?.evidenceSourceId ?? null,
    uploadedFileUrl: prior?.uploadedFileUrl ?? null,
    requiredForPacket: item.requiredForPacket,
    requiredForAttorneyReview: item.requiredForAttorneyReview,
    requiredForAssignmentReview: item.requiredForAssignmentReview,
    requiredForBuyerReview: item.requiredForBuyerReview,
    whyItMatters: item.whyItMatters,
    whereToLookNext: item.whereToLookNext,
    notes:
      status === "missing"
        ? "Document not found — do not pretend it exists."
        : status === "needs_manual_research"
          ? "Official government source not yet attached."
          : null,
    createdAt: prior?.createdAt ?? now(),
    updatedAt: now(),
  };
  return linkEvidence(row, matched);
}

export async function runDocumentFinder(leadId: string): Promise<{
  documents: RequiredDocument[];
  governmentProofDocuments: RequiredDocument[];
  missingCount: number;
  attachedCount: number;
}> {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) throw new Error("Lead not found");

  const evidence = getLeadVerificationBundleSync(leadId, {
    propertyAddress: lead.propertyAddress ?? "",
    ownerName: lead.ownerName,
    parcelId: lead.parcelId,
  });

  const docs = getDocuments({ leadId });
  const existing = getRequiredDocuments(leadId);
  const leadApproved = lead.dataConfidenceScore >= 75 || lead.pipelineStage === "compliance_review";

  const results = REQUIRED_PACKET_ITEMS.map((item) =>
    buildDocumentRow(
      item,
      evidence,
      docs,
      existing.find((e) => e.documentType === item.documentType),
      session,
      leadId,
      leadApproved,
    ),
  );

  saveRequiredDocuments(results);

  const governmentProofDocuments = results.filter((d) =>
    (GOVERNMENT_PROOF_DOCUMENT_TYPES as readonly string[]).includes(d.documentType),
  );

  const missingCount = results.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload", "not_started"].includes(d.status),
  ).length;
  const attachedCount = results.filter((d) =>
    ["found", "attached", "approved"].includes(d.status),
  ).length;

  return { documents: results, governmentProofDocuments, missingCount, attachedCount };
}

export function getGovernmentProofDocuments(leadId: string): RequiredDocument[] {
  return getRequiredDocuments(leadId).filter((d) =>
    (GOVERNMENT_PROOF_DOCUMENT_TYPES as readonly string[]).includes(d.documentType),
  );
}

export function getMissingDocuments(leadId: string): RequiredDocument[] {
  return getRequiredDocuments(leadId).filter((d) =>
    ["missing", "needs_manual_research", "needs_upload", "not_started"].includes(d.status),
  );
}
