import type { GovernmentVerificationStatus, GovernmentVerificationEvaluation } from "@/lib/types/government";
import type { LeadVerificationBundle } from "@/lib/types/verification";

const OFFICIAL_PROPERTY_TYPES = /property_assessment|gis_parcel|tax_record|assessor|parcel/i;
const OFFICIAL_DEED_TYPES = /deed|land_record|transfer|recorder/i;
const OFFICIAL_ESTATE_TYPES = /probate|estate|wills|court/i;

export function evaluateGovernmentVerification(
  bundle: LeadVerificationBundle,
  manualApproved = false
): GovernmentVerificationEvaluation {
  const missing: string[] = [];

  const hasProperty = bundle.evidenceSources.some(
    (e) => OFFICIAL_PROPERTY_TYPES.test(e.sourceType) || OFFICIAL_PROPERTY_TYPES.test(e.sourceName)
  );
  const hasDeed = bundle.evidenceSources.some(
    (e) => OFFICIAL_DEED_TYPES.test(e.sourceType) || OFFICIAL_DEED_TYPES.test(e.citationLabel ?? "")
  );
  const hasEstate = bundle.evidenceSources.some(
    (e) => OFFICIAL_ESTATE_TYPES.test(e.sourceType) || OFFICIAL_ESTATE_TYPES.test(e.citationLabel ?? "")
  );
  const hasPerson = bundle.persons.length > 0;
  const hasContact = bundle.contactCandidates.length > 0;
  const hasVisual = bundle.propertyMedia.length > 0;
  const allCited = bundle.evidenceSources.length > 0;

  if (!hasProperty) missing.push("Official property/assessment/tax/GIS match");
  if (!hasDeed) missing.push("Official deed or transfer record");
  if (!hasEstate) missing.push("Official estate/probate/death-related signal");
  if (!hasPerson) missing.push("Person connection through estate/probate/deed/property record");
  if (!hasVisual) missing.push("At least one property visual (parcel map, assessor photo, or GIS)");
  if (!allCited) missing.push("All claims must have evidence citations");

  let status: GovernmentVerificationStatus = "unverified";
  if (hasProperty) status = "government_property_match";
  if (hasDeed) status = "transfer_record_found";
  if (hasEstate) status = "estate_signal_found";
  if (hasPerson) status = "possible_heir_found";
  if (hasContact) status = "contact_candidate_found";

  const proofChainComplete =
    hasProperty && hasDeed && hasEstate && hasPerson && hasVisual && allCited;

  const canVerify = proofChainComplete && manualApproved;
  if (canVerify) status = "verified_government_lead";

  return {
    status,
    canVerify,
    missingRequirements: missing,
    proofChainComplete,
  };
}

export function statusFromGovernmentRecords(recordTypes: string[]): GovernmentVerificationStatus {
  const blob = recordTypes.join(" ");
  if (/probate|estate/i.test(blob) && /deed|land/i.test(blob) && /property|gis|tax|assessment/i.test(blob)) {
    return "estate_signal_found";
  }
  if (/deed|land/i.test(blob)) return "transfer_record_found";
  if (/property|gis|tax|assessment/i.test(blob)) return "government_property_match";
  return "unverified";
}
