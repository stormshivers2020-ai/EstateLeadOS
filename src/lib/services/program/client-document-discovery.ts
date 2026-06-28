import { isLocalPreviewMode } from "@/lib/config/runtime";
import { GOVERNMENT_PROOF_DOCUMENT_TYPES } from "@/lib/constants/required-packet-items";
import { runDocumentFinder, getGovernmentProofDocuments } from "@/lib/services/program/document-finder";
import type { RequiredDocument } from "@/lib/types/program";

export async function discoverRequiredDocuments(leadId: string): Promise<{
  documents: RequiredDocument[];
  governmentProofDocuments: RequiredDocument[];
  missingCount: number;
  attachedCount: number;
}> {
  if (isLocalPreviewMode()) {
    return runDocumentFinder(leadId);
  }

  const res = await fetch("/api/program/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "find_missing_documents", leadId, mode: "assisted" }),
  });
  const json = await res.json();
  const documents = (json.details?.documents ?? []) as RequiredDocument[];
  const governmentProofDocuments =
    (json.details?.governmentProofDocuments as RequiredDocument[] | undefined)
    ?? documents.filter((d) => (GOVERNMENT_PROOF_DOCUMENT_TYPES as readonly string[]).includes(d.documentType));
  return {
    documents,
    governmentProofDocuments,
    missingCount: json.details?.missingCount ?? 0,
    attachedCount: json.details?.attachedCount ?? 0,
  };
}

export { getGovernmentProofDocuments };
