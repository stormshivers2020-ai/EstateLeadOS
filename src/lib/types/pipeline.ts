export type CountyPipelineStatus =
  | "not_started"
  | "needs_manual_source_review"
  | "configured"
  | "active"
  | "paused";

export type CountyAutomationMode =
  | "manual"
  | "assisted"
  | "supervised"
  | "full_automation";

export type LeadPipelineStage =
  | "new_government_signal"
  | "estate_signal_found"
  | "decedent_identified"
  | "property_match_found"
  | "deed_transfer_checked"
  | "possible_heir_or_representative_found"
  | "property_visual_added"
  | "contact_candidate_found"
  | "ready_for_manual_review"
  | "verified_government_lead"
  | "rejected_bad_match"
  | "rejected_non_government_source"
  | "needs_manual_research";

export interface CountyPipelineConfig {
  id: string;
  organizationId: string;
  stateAbbr: string;
  countyName: string;
  status: CountyPipelineStatus;
  automationMode: CountyAutomationMode;
  isPaused: boolean;
  isProofEngine: boolean;
  activeSourceIds: string[];
  signalsFound: number;
  estateMatches: number;
  propertyMatches: number;
  readyForReview: number;
  verifiedLeads: number;
  rejectedLeads: number;
  lastRunAt?: string | null;
  lastRunId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPipelineItem {
  id: string;
  organizationId: string;
  leadId?: string | null;
  countyConfigId?: string | null;
  stateAbbr: string;
  countyName: string;
  pipelineStage: LeadPipelineStage;
  propertyAddress?: string | null;
  decedentName?: string | null;
  personalRepresentative?: string | null;
  confidenceScore: number;
  governmentSourcesOnly: boolean;
  manualApprovalRequired: boolean;
  manuallyApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPipelineEvent {
  id: string;
  organizationId: string;
  pipelineItemId?: string | null;
  leadId?: string | null;
  countyConfigId?: string | null;
  automationRunId?: string | null;
  actorUserId?: string | null;
  actorUserName?: string | null;
  eventType: string;
  priorStage?: string | null;
  newStage?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  confidenceScore?: number | null;
  reason?: string | null;
  evidenceId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AutomationRunRecord {
  id: string;
  organizationId: string;
  countyConfigId?: string | null;
  stateAbbr: string;
  countyName: string;
  runType: string;
  status: "running" | "completed" | "failed" | "paused";
  automationMode: CountyAutomationMode;
  sourcesQueried: number;
  signalsFound: number;
  itemsCreated: number;
  itemsRejected: number;
  errors: number;
  startedAt: string;
  completedAt?: string | null;
  summary?: string | null;
  createdAt: string;
}

export const PIPELINE_STAGE_LABELS: Record<LeadPipelineStage, string> = {
  new_government_signal: "Government Signal",
  estate_signal_found: "Estate Signal",
  decedent_identified: "Decedent Identified",
  property_match_found: "Property Match",
  deed_transfer_checked: "Deed / Transfer Check",
  possible_heir_or_representative_found: "Possible Representative",
  property_visual_added: "Property Visual",
  contact_candidate_found: "Contact Candidate",
  ready_for_manual_review: "Ready for Manual Review",
  verified_government_lead: "Verified Government Lead",
  rejected_bad_match: "Rejected — Bad Match",
  rejected_non_government_source: "Rejected — Non-Government",
  needs_manual_research: "Needs Manual Research",
};

export const COUNTY_STATUS_LABELS: Record<CountyPipelineStatus, string> = {
  not_started: "Not Started",
  needs_manual_source_review: "Needs Source Review",
  configured: "Configured",
  active: "Active",
  paused: "Paused",
};

export const PIPELINE_DISCLAIMER =
  "EstateLeadOS provides public-record research assistance only. Verify all records manually before outreach. EstateLeadOS does not provide legal advice and does not automatically contact property owners, heirs, or representatives.";
