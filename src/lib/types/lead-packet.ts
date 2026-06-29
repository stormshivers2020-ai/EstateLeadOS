/** Unified lead packet — built only from real lead data (no invented records). */

export type LeadPacketRecordStatus =
  | "draft"
  | "missing_data"
  | "review_ready"
  | "attorney_review_needed"
  | "archived";

export type LeadPacketRecommendation =
  | "pursue"
  | "hold_for_more_research"
  | "reject"
  | "send_to_attorney"
  | "prepare_outreach"
  | "archive_inactive"
  | "pending_decision";

export interface LeadPacketOverview {
  leadId: string;
  estateName: string | null;
  ownerName: string | null;
  propertyAddress: string | null;
  county: string | null;
  state: string | null;
  leadStatus: string | null;
  leadSource: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  leadScore: number | null;
  confidenceScore: number | null;
}

export interface LeadPacketSourceItem {
  id: string;
  url: string | null;
  title: string | null;
  agency: string | null;
  sourceType: string;
  confidence: number | null;
  capturedAt: string | null;
  notes: string | null;
  screenshotUrl: string | null;
}

export interface LeadPacketProbateEvidence {
  probateRecord: string | null;
  deathRecord: string | null;
  obituaryRecord: string | null;
  registerOfWillsSource: string | null;
  estateFiling: string | null;
  courtReference: string | null;
  verificationStatus: string | null;
  citations: string[];
  notes: string | null;
  unavailableReason: string | null;
}

export interface LeadPacketPropertyEvidence {
  propertyAddress: string | null;
  parcelId: string | null;
  deedSource: string | null;
  taxRecordSource: string | null;
  sdatGisSource: string | null;
  landRecordSource: string | null;
  ownerConnectionNotes: string | null;
  propertyConfidenceScore: number | null;
  unavailableReason: string | null;
}

export interface LeadPacketMediaItem {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  mediaType: string;
  source: string | null;
  capturedAt: string | null;
  unavailableReason: string | null;
}

export interface LeadPacketContactItem {
  id: string;
  name: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  mailingAddress: string | null;
  confidence: "verified" | "likely" | "weak" | "unknown";
  sourceNotes: string | null;
  verificationStatus: string | null;
}

export interface LeadPacketDealEstimate {
  arvLow: number | null;
  arvHigh: number | null;
  offerLow: number | null;
  offerHigh: number | null;
  assignmentFeeTarget: number | null;
  repairAssumptions: string | null;
  buyerDemandNotes: string | null;
  riskNotes: string | null;
  disclaimer: string;
  source: "calculator" | "walkthrough" | "lead_fields" | "none";
}

export interface LeadPacketCompliance {
  complianceStatus: string | null;
  attorneyReviewStatus: string | null;
  outreachAllowed: "yes" | "no" | "pending";
  legalWarnings: string[];
  notes: string | null;
  nextRequiredReviewStep: string | null;
}

export interface LeadPacketWalkthroughStepSummary {
  stepId: string;
  completed: boolean;
  notes: string | null;
  decision: string | null;
  missingItems: string[];
}

export interface LeadPacketWalkthroughSummary {
  sessionId: string | null;
  status: string | null;
  completedSteps: string[];
  stepSummaries: LeadPacketWalkthroughStepSummary[];
  missingItems: string[];
  finalOutcome: string | null;
  nextAction: string | null;
}

export interface LeadPacketRecommendationSection {
  recommendation: LeadPacketRecommendation;
  rationale: string | null;
  pendingDecisionNote: string | null;
}

export interface LeadPacketAppendix {
  rawNotes: string[];
  auditExcerpt: string[];
}

export interface LeadPacketConfidenceSummary {
  overall: number | null;
  sourceConfidence: number | null;
  propertyConfidence: number | null;
  contactConfidence: string | null;
  dataConfidenceScore: number | null;
}

export interface LeadPacketContent {
  overview: LeadPacketOverview;
  sourceDiscovery: LeadPacketSourceItem[];
  probateEvidence: LeadPacketProbateEvidence;
  propertyEvidence: LeadPacketPropertyEvidence;
  propertyMedia: LeadPacketMediaItem[];
  contactCandidates: LeadPacketContactItem[];
  contactNotFoundReason: string | null;
  dealEstimate: LeadPacketDealEstimate | null;
  compliance: LeadPacketCompliance;
  walkthrough: LeadPacketWalkthroughSummary | null;
  recommendation: LeadPacketRecommendationSection;
  appendix: LeadPacketAppendix;
}

export interface LeadPacketRecord {
  id: string;
  organizationId: string;
  leadId: string;
  packetStatus: LeadPacketRecordStatus;
  packetVersion: number;
  packetJson: LeadPacketContent;
  missingRequirements: string[];
  sourceCount: number;
  evidenceCount: number;
  mediaCount: number;
  contactCount: number;
  confidenceSummary: LeadPacketConfidenceSummary;
  generatedAt: string;
  updatedAt: string;
  generatedBy: string;
}

export const PACKET_ESTIMATE_DISCLAIMER =
  "Deal estimates are analytical ranges only — not appraisals, offers, or legal valuations. Verify independently before outreach or contracting.";

export const PACKET_CONTACT_DISCLAIMER =
  "Contact information is not guaranteed unless marked verified with supporting evidence. Do not outreach without compliance review.";
