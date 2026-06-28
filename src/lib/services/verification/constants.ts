import type { PersonRoleLabel, ProofChainStepKind } from "@/lib/types/verification";

export const VERIFICATION_DISCLAIMER =
  "EstateLeadOS — Powered by SCS Nova — provides research assistance only. Verify all records manually before outreach. This is not legal advice. EstateLeadOS does not auto-contact anyone.";

export const PERSON_ROLE_LABELS: Record<PersonRoleLabel, string> = {
  possible_heir: "Possible heir",
  possible_personal_representative: "Possible personal representative",
  possible_interested_person: "Possible interested person",
  needs_verification: "Needs verification",
  verified_by_source: "Verified by source",
  manually_approved: "Manually approved",
};

export const CONTACT_STATUS_LABELS = {
  unverified: "Unverified",
  weak_match: "Weak match",
  likely_match: "Likely match",
  verified: "Verified candidate",
  rejected: "Rejected",
  do_not_contact: "Do not contact",
} as const;

export const PROOF_CHAIN_TITLES: Record<ProofChainStepKind, string> = {
  government_signal: "Government signal found",
  estate_probate_signal: "Estate / probate / inheritance signal found",
  decedent_estate_party: "Decedent or estate party identified",
  property_match: "Property match found",
  deed_transfer_checked: "Deed / transfer checked",
  representative_party: "Possible representative / responsible party identified",
  property_visual: "Property visual added",
  evidence_citations: "Evidence citations attached",
  contact_candidate: "Contact candidate added separately",
  manual_review: "Manual review required",
};

export const PROOF_CHAIN_ORDER: ProofChainStepKind[] = [
  "government_signal",
  "estate_probate_signal",
  "decedent_estate_party",
  "property_match",
  "deed_transfer_checked",
  "representative_party",
  "property_visual",
  "evidence_citations",
  "contact_candidate",
  "manual_review",
];
