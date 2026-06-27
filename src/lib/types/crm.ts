export const CRM_PIPELINE_STAGES = [
  "new_lead",
  "needs_research",
  "researching",
  "contact_ready",
  "first_outreach_sent",
  "follow_up_needed",
  "conversation_started",
  "interested",
  "appointment_set",
  "offer_research",
  "offer_sent",
  "negotiating",
  "under_contract",
  "compliance_review",
  "buyer_matching",
  "assignment_sent",
  "closing_scheduled",
  "closed_won",
  "closed_lost",
  "dead_lead",
  "do_not_contact",
] as const;

export type CrmPipelineStage = (typeof CRM_PIPELINE_STAGES)[number];

export const CONTACT_METHODS = [
  "call", "voicemail", "sms", "email", "direct_mail", "postcard",
  "in_person", "title_company", "buyer_contact", "internal_note",
] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_ROLES = [
  "owner", "possible_heir", "executor", "personal_representative",
  "family_member", "buyer", "title_company", "attorney", "broker", "unknown", "other",
] as const;

export type ContactRole = (typeof CONTACT_ROLES)[number];

export const COMMUNICATION_OUTCOMES = [
  "no_answer", "left_voicemail", "sent_message", "sent_letter",
  "conversation_started", "interested", "not_interested", "follow_up_requested",
  "appointment_set", "wrong_contact", "do_not_contact", "needs_research",
  "undeliverable", "bounced", "internal_note_only",
] as const;

export type CommunicationOutcome = (typeof COMMUNICATION_OUTCOMES)[number];

export const CONSENT_STATUSES = [
  "unknown", "not_applicable", "consent_needed", "consent_recorded",
  "opted_out", "do_not_contact", "manual_review_required",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "unknown", "needs_research", "partially_verified", "verified",
  "conflicting_data", "not_verified", "manual_review_required",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const OUTREACH_TEMPLATE_CATEGORIES = [
  "soft_inquiry_letter", "first_call_script", "voicemail_script", "email_inquiry",
  "follow_up_letter", "interested_seller_script", "appointment_confirmation",
  "offer_explanation", "not_interested_response", "do_not_contact_confirmation",
  "buyer_outreach", "title_company_intake",
] as const;

export type OutreachTemplateCategory = (typeof OUTREACH_TEMPLATE_CATEGORIES)[number];

export const OUTREACH_TONES = [
  "soft", "neutral", "professional", "informational", "follow_up",
  "appointment", "no_pressure", "compliance_safe",
] as const;

export type OutreachTone = (typeof OUTREACH_TONES)[number];

export const SAFETY_STATUSES = [
  "approved", "needs_review", "blocked", "requires_compliance_review",
  "requires_state_warning", "requires_user_acknowledgement",
] as const;

export type SafetyStatus = (typeof SAFETY_STATUSES)[number];

export const FOLLOW_UP_PRIORITIES = ["low", "normal", "high", "urgent", "compliance_sensitive"] as const;
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number];

export const FOLLOW_UP_STATUSES = [
  "scheduled", "due_today", "overdue", "complete", "cancelled", "blocked", "do_not_contact",
] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const NOTE_TYPES = [
  "general", "research", "owner_verification", "source_review", "compliance",
  "outreach", "call_summary", "appointment", "offer", "internal_decision",
  "dead_lead_reason", "closed_lost_reason",
] as const;

export type NoteType = (typeof NOTE_TYPES)[number];

export interface PipelineStageDefinition {
  id: CrmPipelineStage;
  name: string;
  order: number;
  description: string;
  requiredActions: string[];
  suggestedNextStep: string;
  blockers: string[];
  documentsNeeded: string[];
  complianceChecks: string[];
  allowedPreviousStages: CrmPipelineStage[];
  allowedNextStages: CrmPipelineStage[];
  completionCriteria: string;
  requiresComplianceClearance?: boolean;
}

export interface OwnerHeirInfo {
  currentOwnerName: string | null;
  priorOwnerName: string | null;
  possibleHeirName: string | null;
  executorName: string | null;
  mailingAddress: string | null;
  propertyAddress: string;
  ownerOccupiedStatus: "yes" | "no" | "unknown";
  outOfStateOwner: "yes" | "no" | "unknown";
  mailingDiffersFromProperty: "yes" | "no" | "unknown";
  relationshipConfidence: number;
  ownerVerificationStatus: VerificationStatus;
  heirVerificationStatus: VerificationStatus;
  contactSource: string;
  phone: string | null;
  email: string | null;
  consentStatus: ConsentStatus;
  doNotContact: boolean;
  notes: string | null;
}

export interface FullLeadDetail {
  id: string;
  organizationId: string;
  propertyAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcelId: string | null;
  propertyType: string | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  lotSize: string | null;
  yearBuilt: number | null;
  estimatedValue: number | null;
  taxAssessedValue: number | null;
  lastSaleDate: string | null;
  lastSaleAmount: number | null;
  lastTransferDate: string | null;
  transferType: string | null;
  deedType: string | null;
  mortgageStatus: string | null;
  mortgageAmount: number | null;
  mortgageDate: string | null;
  taxDelinquent: boolean;
  vacancySignal: boolean;
  listedStatus: boolean;
  ownerName: string;
  possibleHeirName: string | null;
  mailingAddress: string | null;
  primaryLeadType: string;
  secondaryLeadTypes: string[];
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  dataConfidenceScore: number;
  scoreBand: string;
  positiveFactors: string[];
  negativeFactors: string[];
  missingData: string[];
  manualVerificationNeeded: string[];
  signals: { name: string; category: string; explanation: string; confidence: number }[];
  sourceRecords: {
    id: string;
    sourceName: string;
    sourceType: string;
    sourceUrl: string | null;
    retrievedAt: string;
    reliabilityScore: number;
    freshnessScore: number;
    permissionStatus: string;
    fieldsProvided: string[];
  }[];
  origin: string;
  pipelineStage: CrmPipelineStage;
  assignedUserId: string | null;
  assignedUserName: string | null;
  nextAction: string;
  followUpDate: string | null;
  lastContactDate: string | null;
  doNotContact: boolean;
  dncReason: string | null;
  ownerHeir: OwnerHeirInfo;
  demoRecord: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachTemplate {
  id: string;
  organizationId: string | null;
  templateName: string;
  category: OutreachTemplateCategory;
  channel: ContactMethod;
  stateApplicability: string[];
  dealTypeApplicability: string[];
  tone: OutreachTone;
  body: string;
  variables: string[];
  requiredDisclaimerFlag: boolean;
  dncReminderFlag: boolean;
  consentReminderFlag: boolean;
  safetyStatus: SafetyStatus;
  reviewStatus: string;
  lastReviewedAt: string | null;
  active: boolean;
}

export interface OutreachSafetyCheckResult {
  safetyStatus: SafetyStatus;
  blocked: boolean;
  flaggedPhrases: string[];
  riskReasons: string[];
  suggestedRewrite: string | null;
  feedback: string[];
}

export interface CommunicationLog {
  id: string;
  leadId: string;
  organizationId: string;
  userId: string;
  userName: string;
  communicationDate: string;
  communicationTime: string;
  contactMethod: ContactMethod;
  contactPerson: string;
  contactRole: ContactRole;
  templateUsedId: string | null;
  templateUsedName: string | null;
  messageBodySnapshot: string;
  outcome: CommunicationOutcome;
  followUpDate: string | null;
  consentStatus: ConsentStatus;
  dncStatus: boolean;
  stateOutreachWarningReviewed: boolean;
  dncReminderAcknowledged: boolean;
  notes: string | null;
  createdAt: string;
}

export interface FollowUpReminder {
  id: string;
  leadId: string;
  organizationId: string;
  assignedUserId: string;
  assignedUserName: string;
  propertyAddress: string;
  followUpDate: string;
  followUpTime: string | null;
  followUpMethod: ContactMethod;
  reason: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  relatedCommunicationId: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DoNotContactRecord {
  id: string;
  leadId: string;
  organizationId: string;
  contactPerson: string;
  contactMethod: string;
  reason: string;
  source: string;
  setByUserId: string;
  setByUserName: string;
  setAt: string;
  notes: string | null;
  active: boolean;
}

export interface LeadNote {
  id: string;
  leadId: string;
  organizationId: string;
  userId: string;
  userName: string;
  noteType: NoteType;
  body: string;
  visibility: string;
  pinned: boolean;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmAuditEvent {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  leadId: string;
  eventType: string;
  previousValue: string | null;
  newValue: string | null;
  eventDescription: string;
  timestamp: string;
  relatedModule: string;
  riskLevel: string | null;
}

export interface PipelineStageChangeResult {
  allowed: boolean;
  fromStage: CrmPipelineStage;
  toStage: CrmPipelineStage;
  blockedReason: string | null;
  complianceMessage: string | null;
  documentBlockers?: import("@/lib/types/documents").DocumentWorkflowBlocker[];
}

export interface LeadPipelineCard {
  id: string;
  propertyAddress: string;
  leadType: string;
  estateLeadScore: number;
  complianceRiskScore: number;
  assignedUserName: string | null;
  nextAction: string;
  followUpDate: string | null;
  lastContactDate: string | null;
  pipelineStage: CrmPipelineStage;
  hasBlocker: boolean;
  doNotContact: boolean;
}
