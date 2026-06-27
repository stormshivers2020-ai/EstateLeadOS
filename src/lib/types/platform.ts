import type { PlanId } from "@/lib/constants/plans";
import type { UserRoleId } from "@/lib/constants/roles";

export const ACCOUNT_STATUSES = [
  "invited", "active", "suspended", "past_due_locked", "trial", "disabled", "archived",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ORG_STATUSES = [
  "active", "trial", "past_due", "suspended", "cancelled", "archived", "enterprise", "internal_demo",
] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

export const BILLING_STATUSES = [
  "trial", "active", "past_due", "suspended", "cancelled", "enterprise_invoice", "comped", "internal_demo",
] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const LICENSE_TYPES = [
  "state_license", "county_license", "multi_county_license", "city_license", "zip_license",
  "enterprise_market_license", "research_only_access", "manual_upload_access",
] as const;
export type LicenseType = (typeof LICENSE_TYPES)[number];

export const LICENSE_STATUSES = [
  "active", "trial", "pending", "expired", "suspended", "cancelled", "research_only", "manual_upload_only",
] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export const API_KEY_STATUSES = ["active", "disabled", "expired", "revoked", "pending"] as const;
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export const TICKET_PRIORITIES = [
  "low", "normal", "high", "urgent", "compliance_sensitive", "billing_critical",
] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  "new", "open", "waiting_on_user", "waiting_on_scs_nova", "in_review", "resolved", "closed", "archived",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const AUDIT_SEVERITIES = ["info", "notice", "warning", "critical", "security", "compliance"] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const HEALTH_STATUSES = [
  "operational", "degraded", "partial_outage", "major_outage", "maintenance", "unknown",
] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const WL_VISIBILITY = [
  "always_visible", "footer_only", "admin_only", "enterprise_hidden", "not_configurable",
] as const;
export type WhiteLabelVisibility = (typeof WL_VISIBILITY)[number];

export const ADMIN_SECTIONS = [
  "overview", "users", "organizations", "states", "counties",
  "data_sources", "lead_rules", "compliance_rules", "document_templates", "outreach_templates",
  "buyer_network_controls", "api_keys", "audit_logs", "support_tickets",
  "white_label", "system_health", "scs_nova_settings",
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export interface PlatformUser {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRoleId;
  seatStatus: "active" | "inactive" | "pending";
  accountStatus: AccountStatus;
  planAccess: PlanId;
  activeStates: string[];
  activeCounties: string[];
  lastLoginAt: string | null;
  invitedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformOrganization {
  id: string;
  organizationName: string;
  planId: PlanId;
  ownerUserId: string;
  ownerName: string;
  userCount: number;
  seatLimit: number;
  activeStates: string[];
  activeCounties: string[];
  monthlyLeadLimit: number;
  monthlyImportLimit: number;
  monthlyExportLimit: number;
  dataAccessLevel: string;
  documentAccessLevel: string;
  complianceLevel: string;
  buyerNetworkAccess: boolean;
  assignmentTrackerAccess: boolean;
  billingStatus: BillingStatus;
  whiteLabelStatus: boolean;
  trialStatus: boolean;
  accountStatus: OrgStatus;
  renewalDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPlan {
  id: PlanId;
  planName: string;
  description: string;
  monthlyPricePlaceholder: number | null;
  annualPricePlaceholder: number | null;
  seatLimit: number | null;
  leadLimit: number | null;
  stateLimit: number | null;
  countyLimit: number | null;
  importLimit: number | null;
  exportLimit: number | null;
  features: Record<string, boolean>;
  supportLevel: string;
  active: boolean;
}

export interface MarketLicense {
  id: string;
  organizationId: string;
  organizationName: string;
  licenseType: LicenseType;
  state: string;
  county: string | null;
  city: string | null;
  zip: string | null;
  exclusivePlaceholder: boolean;
  leadVolumeLimit: number;
  dataAutomationAccess: boolean;
  csvImportAccess: boolean;
  startDate: string;
  renewalDate: string;
  status: LicenseStatus;
  billingReferencePlaceholder: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingAccount {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: PlanId;
  billingStatus: BillingStatus;
  billingCycle: "monthly" | "annual";
  subscriptionStartDate: string;
  renewalDate: string;
  trialEndDate: string | null;
  seatsPurchased: number;
  marketsLicensed: number;
  leadPacksPurchased: number;
  paymentProviderCustomerIdPlaceholder: string | null;
  paymentProviderSubscriptionIdPlaceholder: string | null;
  invoiceStatus: string;
  pastDueDate: string | null;
  cancellationDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  usageType: string;
  count: number;
  periodStart: string;
  periodEnd: string;
  relatedPlanLimit: number;
  overLimit: boolean;
  percentUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelSettings {
  id: string;
  organizationId: string;
  organizationName: string;
  enabled: boolean;
  logoUrlPlaceholder: string | null;
  brandColor: string;
  accentColor: string;
  appSubtitle: string;
  loginScreenHeadline: string;
  loginScreenSubheadline: string;
  emailFooterText: string;
  reportBrandingText: string;
  documentHeaderText: string;
  customDomainPlaceholder: string | null;
  poweredByScsNovaVisibility: WhiteLabelVisibility;
  approvedByScsNova: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  organizationId: string;
  organizationName: string;
  keyName: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  status: ApiKeyStatus;
  expirationDate: string | null;
  notes: string | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  issueType: string;
  relatedLeadId: string | null;
  relatedDocumentId: string | null;
  relatedState: string | null;
  relatedCounty: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface PlatformAuditLog {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  userId: string;
  userName: string;
  eventType: string;
  eventCategory: string;
  relatedModule: string;
  relatedRecordId: string | null;
  previousValue: string | null;
  newValue: string | null;
  eventDescription: string;
  ipDevicePlaceholder: string | null;
  timestamp: string;
  severity: AuditSeverity;
  metadata: Record<string, string> | null;
}

export interface SystemHealthRecord {
  id: string;
  statusArea: string;
  status: HealthStatus;
  message: string;
  lastCheckedAt: string;
  relatedLogReference: string | null;
  adminNote: string | null;
}

export interface ScsNovaSettings {
  id: string;
  platformName: string;
  poweredByText: string;
  defaultLogo: string;
  defaultAccentColor: string;
  globalDisclaimerText: string;
  defaultSupportEmailPlaceholder: string;
  defaultSupportPhonePlaceholder: string;
  defaultBillingMode: string;
  demoModeEnabled: boolean;
  freshStartModeEnabled: boolean;
  maintenanceModeEnabled: boolean;
  defaultDataRetentionPlaceholder: string;
  termsUrlPlaceholder: string;
  privacyUrlPlaceholder: string;
  changelogUrlPlaceholder: string;
  roadmapUrlPlaceholder: string;
  updatedAt: string;
}

export interface AdminOverview {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  pastDueOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  scsNovaAdmins: number;
  activeSubscriptions: number;
  mrrPlaceholder: string;
  arrPlaceholder: string;
  marketLicensesActive: number;
  statesEnabled: number;
  countiesEnabled: number;
  dataSourcesActive: number;
  failedDataPulls: number;
  complianceBlockersActive: number;
  documentsNeedingReview: number;
  supportTicketsOpen: number;
  whiteLabelClientsActive: number;
  systemHealthStatus: HealthStatus;
}

export const PLAN_LIMIT_MESSAGE =
  "Your current plan does not include this feature or limit. Contact your organization admin or SCS Nova to upgrade.";

export const MARKET_ACCESS_MESSAGE =
  "This market is not active on your organization's license. Contact SCS Nova or your organization admin to enable access.";

export const PERMISSION_DENIED_MESSAGE =
  "You do not have permission to access this area.";
