import type { PersonRoleLabel } from "@/lib/types/verification";

export const VERIFICATION_DISCLAIMER =
  "EstateLeadOS provides research assistance only. Verify all records manually before outreach. This is not legal advice.";

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

export const PROOF_CHAIN_TITLES = {
  property_address: "Property address",
  owner_record: "Owner record",
  deed_record: "Deed record",
  probate_estate_record: "Probate / estate record",
  possible_person: "Possible heir or representative",
  contact_candidate: "Mailing address / contact candidate",
  manual_approval: "Manual approval",
} as const;
