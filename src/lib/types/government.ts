export type SourceTrustLevel = "official" | "official_secondary" | "enrichment" | "rejected";

export type GovernmentVerificationStatus =
  | "unverified"
  | "government_property_match"
  | "transfer_record_found"
  | "estate_signal_found"
  | "possible_heir_found"
  | "contact_candidate_found"
  | "verified_government_lead"
  | "needs_manual_research"
  | "rejected_bad_match"
  | "rejected_non_government_source";

export type GovernmentRecordType =
  | "property_assessment"
  | "deed_land_record"
  | "probate_estate"
  | "gis_parcel_map"
  | "tax_record"
  | "open_data"
  | "court_record";

export type ContactPersonRole =
  | "possible_heir"
  | "personal_representative"
  | "interested_person"
  | "owner"
  | "mailing_contact";

export interface SourceRegistryEntry {
  id: string;
  sourceName: string;
  sourceType: string;
  jurisdictionState?: string | null;
  jurisdictionCounty?: string | null;
  baseUrl: string;
  isGovernmentSource: boolean;
  trustLevel: SourceTrustLevel;
  allowedForLeadCreation: boolean;
  requiresManualLogin: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface GovernmentNormalizedRecord {
  sourceName: string;
  sourceType: GovernmentRecordType | string;
  sourceUrl: string;
  jurisdiction: string;
  recordType: string;
  propertyAddress?: string | null;
  ownerName?: string | null;
  transferDate?: string | null;
  deedReference?: string | null;
  estateCaseNumber?: string | null;
  decedentName?: string | null;
  personalRepresentative?: string | null;
  interestedPersons?: string[];
  mailingAddress?: string | null;
  confidenceScore: number;
  sourceCertaintyScore?: number;
  hasSourceProof?: boolean;
  fetchMethod?: "live_http" | "snippet_only" | "arcgis_api";
  contentHash?: string | null;
  mediaUrl?: string | null;
  rawPayload: Record<string, unknown>;
  title: string;
  snippet: string;
  registryId?: string;
}

export interface RejectedSourceRecord {
  id: string;
  organizationId: string;
  searchId?: string | null;
  sourceName?: string | null;
  sourceUrl: string;
  sourceType?: string | null;
  rejectionReason: string;
  hostname?: string | null;
  rawTitle?: string | null;
  rawSnippet?: string | null;
  createdAt: string;
}

export interface GovernmentVerificationEvaluation {
  status: GovernmentVerificationStatus;
  canVerify: boolean;
  missingRequirements: string[];
  proofChainComplete: boolean;
}

export const GOVERNMENT_STATUS_LABELS: Record<GovernmentVerificationStatus, string> = {
  unverified: "Unverified",
  government_property_match: "Government property match",
  transfer_record_found: "Transfer record found",
  estate_signal_found: "Estate signal found",
  possible_heir_found: "Possible heir found",
  contact_candidate_found: "Contact candidate found",
  verified_government_lead: "Verified government lead",
  needs_manual_research: "Needs manual research",
  rejected_bad_match: "Rejected — bad match",
  rejected_non_government_source: "Rejected — non-government source",
};
