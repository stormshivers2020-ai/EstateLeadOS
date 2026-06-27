import { getSessionContext } from "@/lib/config/session";
import { REQUIRED_PACKET_ITEMS } from "@/lib/constants/required-packet-items";
import { getFullLeadByIdSync } from "@/lib/services/crm";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import { getDocuments } from "@/lib/services/documents";
import type { RequiredDocument, RequiredDocumentStatus } from "@/lib/types/program";
import { saveRequiredDocuments, getRequiredDocuments } from "./local-store";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

function hasEvidenceType(sources: Array<{ sourceType?: string; sourceName?: string }>, pattern: RegExp): boolean {
  return sources.some((s) => pattern.test(s.sourceType ?? "") || pattern.test(s.sourceName ?? ""));
}

function resolveStatus(
  itemType: string,
  evidence: LeadVerificationBundle | null,
  docs: ReturnType<typeof getDocuments>
): RequiredDocumentStatus {
  const sources = evidence?.evidenceSources ?? [];
  const media = evidence?.propertyMedia ?? [];
  const contacts = evidence?.contactCandidates ?? [];
  const persons = evidence?.persons ?? [];

  switch (itemType) {
    case "lead_summary":
      return evidence ? "attached" : "missing";
    case "property_research_sheet":
      return evidence?.recordHits?.length ? "found" : "needs_manual_research";
    case "government_evidence_sheet":
      return sources.length > 0 ? "attached" : "missing";
    case "probate_estate_sheet":
      return hasEvidenceType(sources, /probate|estate|wills/i) ? "found" : "needs_manual_research";
    case "property_assessment":
      return hasEvidenceType(sources, /assessor|assessment|sdat|property/i) ? "found" : "needs_manual_research";
    case "tax_record":
      return hasEvidenceType(sources, /tax/i) ? "found" : "not_applicable";
    case "deed_transfer_check":
      return hasEvidenceType(sources, /deed|transfer|land|recorder/i) ? "found" : "needs_manual_research";
    case "gis_parcel_visual":
      return media.some((m) => /gis|parcel|map/i.test(m.mediaType ?? "")) ? "attached" : "missing";
    case "property_visual":
      return media.length > 0 ? "attached" : "missing";
    case "responsible_party_sheet":
      return persons.length > 0 || sources.some((s) => /representative|decedent|heir/i.test(s.sourceExcerpt ?? ""))
        ? "found"
        : "needs_manual_research";
    case "contact_candidate_sheet":
      return contacts.length > 0 ? "found" : "not_applicable";
    case "compliance_checklist":
      return docs.some((d) => d.documentCategory === "compliance_documents") ? "found" : "needs_review";
    case "outreach_readiness":
      return "needs_review";
    case "assignment_readiness":
      return "needs_review";
    case "buyer_opportunity_sheet":
      return "not_started";
    case "deal_calculator_printout":
      return "needs_manual_research";
    case "missing_documents_report":
      return "attached";
    case "manual_approval_record":
      return persons.some((p) => p.verificationStatus === "manually_approved") ? "approved" : "needs_review";
    case "audit_trail_summary":
      return (evidence?.actionLogs?.length ?? 0) > 0 ? "attached" : "missing";
    case "final_review_cover":
      return "attached";
    default:
      return "not_started";
  }
}

export async function runDocumentFinder(leadId: string): Promise<{
  documents: RequiredDocument[];
  missingCount: number;
  attachedCount: number;
}> {
  const session = getSessionContext();
  const lead = getFullLeadByIdSync(leadId);
  if (!lead) throw new Error("Lead not found");

  let evidence = null;
  try {
    evidence = await getLeadVerificationBundle(leadId);
  } catch {
    evidence = null;
  }

  const docs = getDocuments({ leadId });
  const existing = getRequiredDocuments(leadId);
  const results: RequiredDocument[] = [];

  for (const item of REQUIRED_PACKET_ITEMS) {
    const status = resolveStatus(item.documentType, evidence, docs);
    const prior = existing.find((e) => e.documentType === item.documentType);
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
      requiredForAssignmentReview: item.requiredForAssignmentReview,
      requiredForBuyerReview: item.requiredForBuyerReview,
      whyItMatters: item.whyItMatters,
      whereToLookNext: item.whereToLookNext,
      notes: status === "missing" ? "Document not found — do not pretend it exists." : null,
      createdAt: prior?.createdAt ?? now(),
      updatedAt: now(),
    };
    results.push(row);
  }

  saveRequiredDocuments(results);
  const missingCount = results.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload", "not_started"].includes(d.status)
  ).length;
  const attachedCount = results.filter((d) => ["found", "attached", "approved"].includes(d.status)).length;

  return { documents: results, missingCount, attachedCount };
}

export function getMissingDocuments(leadId: string): RequiredDocument[] {
  return getRequiredDocuments(leadId).filter((d) =>
    ["missing", "needs_manual_research", "needs_upload", "not_started"].includes(d.status)
  );
}
