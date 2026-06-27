import type { PlanId } from "@/lib/constants/plans";
import type { UserRoleId } from "@/lib/constants/roles";

export interface Organization {
  id: string;
  name: string;
  planId: PlanId;
  ownerId: string;
  seats: number;
  activeStates: string[];
  activeCounties: string[];
  monthlyLeadLimit: number | null;
  dataAccessLevel: string;
  documentAccessLevel: string;
  complianceLevel: string;
  billingStatus: BillingStatus;
  whiteLabelStatus: boolean;
  createdAt: string;
  renewalDate: string | null;
}

export type BillingStatus =
  | "trial"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRoleId;
  organizationId: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalEstateLeads: number;
  newLeadsThisWeek: number;
  highScoreLeads: number;
  leadsByState: { state: string; count: number }[];
  leadsByCounty: { county: string; state: string; count: number }[];
  leadsNeedingComplianceReview: number;
  leadsReadyForOutreach: number;
  leadsUnderContract: number;
  estimatedPipelineSpread: number;
  documentsPending: number;
  followUpsDue: number;
  riskAlerts: number;
  supportedStates: number;
  supportedCounties: number;
  dataSourceHealth: "healthy" | "degraded" | "critical";
  systemStatus: "operational" | "maintenance" | "degraded";
  assignmentSummary: { active: number; closing: number; closed: number };
  buyerMatchingActivity: number;
  documentReadinessPercent: number;
  usageLimitPercent: number;
  planName: string;
  planStatus: string;
  openSupportTickets: number;
}

export interface ModuleStatus {
  id: string;
  name: string;
  phase: number;
  status: "active" | "placeholder" | "coming_soon";
  description: string;
}
