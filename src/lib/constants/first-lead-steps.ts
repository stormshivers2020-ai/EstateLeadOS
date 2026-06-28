import type { WalkthroughStepId } from "@/lib/types/walkthrough";

export interface WalkthroughStepMeta {
  id: WalkthroughStepId;
  stepNumber: number;
  title: string;
  purpose: string;
}

export const FIRST_LEAD_STEP_META: WalkthroughStepMeta[] = [
  { id: "start", stepNumber: 0, title: "Start / Select Lead", purpose: "Choose or create your first walkthrough lead." },
  { id: "source_discovery", stepNumber: 1, title: "Source Discovery", purpose: "Attach official or semi-official source links." },
  { id: "death_probate", stepNumber: 2, title: "Death / Probate Verification", purpose: "Verify death, probate, or estate filing evidence." },
  { id: "property_verification", stepNumber: 3, title: "Property Verification", purpose: "Connect the estate to real property records." },
  { id: "property_media", stepNumber: 4, title: "Property Media", purpose: "Attach maps, photos, or GIS screenshots." },
  { id: "heir_discovery", stepNumber: 5, title: "Heir / Representative", purpose: "Identify possible heirs or representatives." },
  { id: "contact_path", stepNumber: 6, title: "Contact Path", purpose: "Capture usable contact methods or skip reason." },
  { id: "lead_qualification", stepNumber: 7, title: "Lead Qualification", purpose: "Decide pursue, hold, or reject." },
  { id: "deal_value", stepNumber: 8, title: "Deal / Value Estimate", purpose: "Estimate value, offer range, and assignment fee." },
  { id: "packet_builder", stepNumber: 9, title: "Packet Builder", purpose: "Generate and review the lead packet." },
  { id: "attorney_compliance", stepNumber: 10, title: "Attorney / Compliance", purpose: "Mark legal review needs before outreach." },
  { id: "outreach_direction", stepNumber: 11, title: "Outreach Direction", purpose: "Choose the next action path." },
  { id: "final_archive", stepNumber: 12, title: "Final Archive", purpose: "Save the full walkthrough result." },
  { id: "complete", stepNumber: 13, title: "Complete", purpose: "Walkthrough finished." },
];

export function getStepMeta(step: WalkthroughStepId): WalkthroughStepMeta {
  return FIRST_LEAD_STEP_META.find((s) => s.id === step) ?? FIRST_LEAD_STEP_META[0];
}

export const SOURCE_TYPES = [
  "government_register",
  "probate_court",
  "register_of_wills",
  "obituary",
  "tax_assessment",
  "gis_parcel",
  "deed_land_record",
  "other_official",
] as const;

export const CONTACT_TYPES = [
  "heir",
  "personal_representative",
  "executor",
  "attorney",
  "family_member",
  "estate_contact",
  "other",
] as const;

export const NO_CONTACT_REASONS = [
  "no_public_record",
  "needs_skip_trace",
  "attorney_only_contact",
  "privacy_restricted",
  "other",
] as const;
