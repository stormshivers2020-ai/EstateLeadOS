import { evaluateGovernmentVerification } from "@/lib/services/government/verification-engine";
import type { LeadVerificationBundle } from "@/lib/types/verification";
import { assembleVerificationBundle } from "./proof-chain";
import { getLeadVerificationBundleLocal } from "./local-store";

/** Client-safe verification bundle lookup (local preview / browser state). */
export function getLeadVerificationBundleSync(
  leadId: string,
  meta?: { propertyAddress: string; ownerName?: string | null; parcelId?: string | null }
): LeadVerificationBundle | null {
  const local = getLeadVerificationBundleLocal(leadId, meta);
  if (!meta && local.recordHits.length === 0 && local.persons.length === 0) {
    return null;
  }

  const bundle = assembleVerificationBundle(leadId, {
    propertyAddress: meta?.propertyAddress ?? "",
    ownerName: meta?.ownerName,
    parcelId: meta?.parcelId,
    recordHits: local.recordHits,
    evidenceSources: local.evidenceSources,
    persons: local.persons,
    contactCandidates: local.contactCandidates,
    propertyMedia: local.propertyMedia,
    actionLogs: local.actionLogs,
  });

  const governmentEvaluation = evaluateGovernmentVerification(bundle);
  return {
    ...bundle,
    governmentStatus: governmentEvaluation.status,
    governmentEvaluation,
  };
}
