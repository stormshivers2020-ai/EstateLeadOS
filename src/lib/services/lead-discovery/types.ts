export interface InternetSearchHit {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface LeadSearchCandidate {
  propertyAddress: string;
  ownerName: string | null;
  state: string;
  county: string;
  city: string | null;
  leadType: string;
  sourceUrl: string;
  sourceTitle: string;
  snippet: string;
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  dataConfidenceScore: number;
  signals: string[];
  /** Present when sourced from official government connector */
  governmentRecord?: import("@/lib/types/government").GovernmentNormalizedRecord;
  governmentVerificationStatus?: import("@/lib/types/government").GovernmentVerificationStatus;
  isGovernmentSource?: boolean;
}

export interface PendingInternetLead {
  id: string;
  searchId: string;
  discoveredAt: string;
  status: "pending";
  candidate: LeadSearchCandidate;
}

export interface InternetLeadSearchInput {
  state: string;
  county: string;
  city?: string;
  maxResults?: number;
  /** When true (default), only official government sources can create leads */
  governmentSourcesOnly?: boolean;
}

export interface InternetLeadDiscoveryResult {
  searchId: string;
  queries: string[];
  hitsScanned: number;
  candidatesFound: number;
  pendingQueued: number;
  duplicatesSkipped: number;
  rejectedSources: number;
  connectorsRun: number;
  governmentSourcesOnly: boolean;
  errors: number;
  pending: Array<{ id: string; propertyAddress: string; ownerName: string; sourceUrl: string }>;
  warnings: string[];
}

export const PENDING_INTERNET_SOURCE_PREFIX = "Internet Search — Pending Approval";
export const PENDING_INTERNET_PIPELINE = "manual_review";
export const PENDING_INTERNET_NEXT_ACTION = "Awaiting your approval — review internet search hit";
