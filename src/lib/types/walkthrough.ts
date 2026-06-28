/** Deterministic First Lead Walkthrough — finite-state workflow */

export const WALKTHROUGH_STEP_ORDER = [
  "start",
  "source_discovery",
  "death_probate",
  "property_verification",
  "property_media",
  "heir_discovery",
  "contact_path",
  "lead_qualification",
  "deal_value",
  "packet_builder",
  "attorney_compliance",
  "outreach_direction",
  "final_archive",
  "complete",
] as const;

export type WalkthroughStepId = (typeof WALKTHROUGH_STEP_ORDER)[number];

export type WalkthroughSessionStatus = "active" | "draft" | "complete" | "abandoned";

export type WalkthroughLeadStatus = "WALKTHROUGH_ACTIVE" | "WALKTHROUGH_COMPLETE";

export interface WalkthroughSource {
  id: string;
  url: string;
  title: string;
  sourceType: string;
  county: string;
  agency: string;
  notes: string;
  confidence: "high" | "medium" | "low";
  evidenceFileName?: string;
}

export interface WalkthroughContactCandidate {
  id: string;
  name: string;
  contactType: string;
  confidence: "verified" | "likely" | "weak" | "unknown";
  evidenceNotes: string;
  phone?: string;
  email?: string;
  mailingAddress?: string;
}

export interface WalkthroughMediaItem {
  id: string;
  caption: string;
  source: string;
  mediaType: string;
  fileName?: string;
  unavailable?: boolean;
  unavailableReason?: string;
}

export interface WalkthroughStepData {
  start?: {
    estateName: string;
    county: string;
    state: string;
    createNew: boolean;
    selectedLeadId?: string;
  };
  source_discovery?: {
    sources: WalkthroughSource[];
  };
  death_probate?: {
    verificationStatus: "verified" | "partial" | "not_verified";
    citation: string;
    notes: string;
    notVerifiedAction?: "continue_research" | "reject_lead";
  };
  property_verification?: {
    propertyAddress: string;
    parcelId: string;
    sourceCitation: string;
    connectionNotes: string;
    confidence: "high" | "medium" | "low";
  };
  property_media?: {
    media: WalkthroughMediaItem[];
    visibilityNotes: string;
    mediaUnavailable: boolean;
    unavailableReason?: string;
  };
  heir_discovery?: {
    contacts: WalkthroughContactCandidate[];
    contactNotFound: boolean;
    notFoundNotes?: string;
  };
  contact_path?: {
    phone: string;
    email: string;
    mailingAddress: string;
    attorneyContact: string;
    noContactFound: boolean;
    noContactReason: string;
    complianceAcknowledged: boolean;
  };
  lead_qualification?: {
    decision: "pursue" | "hold" | "reject";
    reason: string;
    score: number;
  };
  deal_value?: {
    arvLow: number;
    arvHigh: number;
    offerLow: number;
    offerHigh: number;
    assignmentFeeTarget: number;
    repairAssumptions: string;
    buyerDemandNotes: string;
    riskNotes: string;
    estimatesAcknowledged: boolean;
  };
  packet_builder?: {
    packetId?: string;
    reviewed: boolean;
    status: "draft" | "review_ready";
  };
  attorney_compliance?: {
    reviewStatus: "needs_attorney" | "internal_review" | "rejected_before_review";
    complianceNotes: string;
  };
  outreach_direction?: {
    nextAction:
      | "contact_estate"
      | "research_more"
      | "send_attorney"
      | "prepare_buyer_packet"
      | "archive_inactive";
    taskNotes: string;
    dueDate?: string;
  };
  final_archive?: {
    archiveId?: string;
    archiveLocation: string;
  };
}

export interface LeadWalkthroughSession {
  id: string;
  organizationId: string;
  leadId: string | null;
  currentStep: WalkthroughStepId;
  completedSteps: WalkthroughStepId[];
  stepData: WalkthroughStepData;
  status: WalkthroughSessionStatus;
  locked: boolean;
  finalOutcome: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StepValidationResult {
  valid: boolean;
  missing: string[];
}

export interface WalkthroughEvidenceSummary {
  sourceCount: number;
  evidenceCount: number;
  mediaCount: number;
  contactCount: number;
  contactConfidence: string;
  leadDecision: string;
  packetStatus: string;
  nextAction: string;
  leadName: string;
  propertyAddress: string;
  archiveLocation: string;
}
