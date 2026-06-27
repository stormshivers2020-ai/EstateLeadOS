export type PersonRoleLabel =
  | "possible_heir"
  | "possible_personal_representative"
  | "possible_interested_person"
  | "needs_verification"
  | "verified_by_source"
  | "manually_approved";

export type PersonVerificationStatus =
  | "needs_verification"
  | "verified_by_source"
  | "manually_approved"
  | "rejected"
  | "needs_research";

export type ContactType = "phone" | "email" | "mailing_address";

export type ContactVerificationStatus =
  | "unverified"
  | "weak_match"
  | "likely_match"
  | "verified"
  | "rejected"
  | "do_not_contact";

export type PropertyMediaType =
  | "county_gis_photo"
  | "parcel_map"
  | "assessor_photo"
  | "county_photo"
  | "street_view"
  | "static_map"
  | "source_screenshot";

export interface RecordHit {
  id: string;
  organizationId: string;
  leadId: string;
  searchId?: string | null;
  sourceName?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  rawSnippet?: string | null;
  matchedFields: Record<string, string>;
  confidenceScore: number;
  createdAt: string;
}

export interface EvidenceSource {
  id: string;
  organizationId: string;
  leadId: string;
  recordHitId?: string | null;
  sourceName: string;
  sourceType: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  citationLabel?: string | null;
  retrievedAt: string;
  screenshotUrl?: string | null;
  sourceExcerpt?: string | null;
  sourceHash?: string | null;
  confidenceScore: number;
  matchedFields?: Record<string, string>;
  createdAt: string;
  citationNumber?: number;
  formattedCitation?: string;
}

export interface PersonVerification {
  id: string;
  organizationId: string;
  leadId: string;
  personName: string;
  roleLabel: PersonRoleLabel;
  connectionRationale?: string | null;
  confidenceScore: number;
  verificationStatus: PersonVerificationStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCandidate {
  id: string;
  organizationId: string;
  leadId: string;
  personVerificationId?: string | null;
  personName?: string | null;
  personRole?: string | null;
  contactType: ContactType;
  contactValue: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  confidenceScore: number;
  verificationStatus: ContactVerificationStatus;
  lastVerifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PropertyMedia {
  id: string;
  organizationId: string;
  leadId: string;
  propertyId?: string | null;
  mediaType: PropertyMediaType;
  mediaUrl: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  attribution?: string | null;
  retrievedAt: string;
  createdAt: string;
}

export interface VerificationActionLog {
  id: string;
  organizationId: string;
  leadId: string;
  actorUserId?: string | null;
  actorUserName?: string | null;
  actionType: string;
  targetType: "person" | "contact" | "evidence" | "lead";
  targetId?: string | null;
  sourceEvidenceId?: string | null;
  contactMethod?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type ProofChainStepKind =
  | "property_address"
  | "owner_record"
  | "deed_record"
  | "probate_estate_record"
  | "possible_person"
  | "contact_candidate"
  | "manual_approval";

export interface ProofChainStep {
  id: string;
  kind: ProofChainStepKind;
  title: string;
  description: string;
  status: "complete" | "partial" | "missing" | "pending_approval";
  confidenceScore?: number;
  evidenceIds: string[];
  personId?: string;
  contactId?: string;
}

export interface LeadVerificationBundle {
  leadId: string;
  recordHits: RecordHit[];
  evidenceSources: EvidenceSource[];
  persons: PersonVerification[];
  contactCandidates: ContactCandidate[];
  propertyMedia: PropertyMedia[];
  actionLogs: VerificationActionLog[];
  proofChain: ProofChainStep[];
  governmentStatus?: import("@/lib/types/government").GovernmentVerificationStatus;
  governmentEvaluation?: import("@/lib/types/government").GovernmentVerificationEvaluation;
}
