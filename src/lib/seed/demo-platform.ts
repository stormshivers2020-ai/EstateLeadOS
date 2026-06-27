import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import type {
  AdminOverview,
  ApiKeyRecord,
  BillingAccount,
  MarketLicense,
  PlatformAuditLog,
  PlatformOrganization,
  PlatformUser,
  ScsNovaSettings,
  SupportTicket,
  SystemHealthRecord,
  UsageRecord,
  WhiteLabelSettings,
} from "@/lib/types/platform";

const ts = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString();

export const DEMO_ORGANIZATIONS: PlatformOrganization[] = [
  {
    id: "demo-org", organizationName: "Gulf Coast Acquisitions LLC", planId: "team",
    ownerUserId: "demo-user", ownerName: "Alex Morgan", userCount: 4, seatLimit: 10,
    activeStates: ["TX", "FL", "NC"], activeCounties: ["Harris", "Duval", "Wake"],
    monthlyLeadLimit: 2000, monthlyImportLimit: 500, monthlyExportLimit: 100,
    dataAccessLevel: "standard", documentAccessLevel: "full", complianceLevel: "standard",
    buyerNetworkAccess: true, assignmentTrackerAccess: true,
    billingStatus: "active", whiteLabelStatus: false, trialStatus: false,
    accountStatus: "active", renewalDate: "2026-06-01", notes: "Demo organization — fictional",
    createdAt: ts(365), updatedAt: ts(2),
  },
  {
    id: "demo-org-enterprise", organizationName: "Summit Estate Partners", planId: "enterprise",
    ownerUserId: "user-ent-1", ownerName: "Jordan Blake", userCount: 12, seatLimit: 50,
    activeStates: ["TX", "FL", "GA", "NC", "OH"], activeCounties: [],
    monthlyLeadLimit: 50000, monthlyImportLimit: 5000, monthlyExportLimit: 1000,
    dataAccessLevel: "enterprise", documentAccessLevel: "enterprise", complianceLevel: "enterprise",
    buyerNetworkAccess: true, assignmentTrackerAccess: true,
    billingStatus: "enterprise_invoice", whiteLabelStatus: true, trialStatus: false,
    accountStatus: "enterprise", renewalDate: "2026-12-01", notes: "Enterprise white-label client",
    createdAt: ts(500), updatedAt: ts(10),
  },
  {
    id: "demo-org-pastdue", organizationName: "Riverside Lead Co", planId: "pro",
    ownerUserId: "user-pd-1", ownerName: "Taylor Chen", userCount: 2, seatLimit: 1,
    activeStates: ["FL"], activeCounties: ["Duval"],
    monthlyLeadLimit: 500, monthlyImportLimit: 100, monthlyExportLimit: 25,
    dataAccessLevel: "basic", documentAccessLevel: "standard", complianceLevel: "basic",
    buyerNetworkAccess: false, assignmentTrackerAccess: false,
    billingStatus: "past_due", whiteLabelStatus: false, trialStatus: false,
    accountStatus: "past_due", renewalDate: "2025-05-01", notes: "Past due — demo lock behavior",
    createdAt: ts(200), updatedAt: ts(15),
  },
  {
    id: "demo-org-trial", organizationName: "Starter Probate Research", planId: "starter",
    ownerUserId: "user-trial-1", ownerName: "Morgan Ellis", userCount: 1, seatLimit: 1,
    activeStates: ["TX"], activeCounties: ["Harris"],
    monthlyLeadLimit: 100, monthlyImportLimit: 25, monthlyExportLimit: 10,
    dataAccessLevel: "basic", documentAccessLevel: "checklist", complianceLevel: "basic",
    buyerNetworkAccess: false, assignmentTrackerAccess: false,
    billingStatus: "trial", whiteLabelStatus: false, trialStatus: true,
    accountStatus: "trial", renewalDate: null, notes: "14-day trial",
    createdAt: ts(7), updatedAt: ts(1),
  },
];

export const DEMO_PLATFORM_USERS: PlatformUser[] = [
  {
    id: "demo-user", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    name: "Alex Morgan", email: "alex.morgan@demo-estateleados.test", phone: "(555) 100-2001",
    role: "scs_nova_super_admin", seatStatus: "active", accountStatus: "active", planAccess: "team",
    activeStates: ["TX", "FL", "NC"], activeCounties: ["Harris", "Duval", "Wake"],
    lastLoginAt: ts(0), invitedBy: null, notes: "Demo super admin", createdAt: ts(365), updatedAt: ts(0),
  },
  {
    id: "user-2", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    name: "Sam Rivera", email: "s.rivera@demo-estateleados.test", phone: null,
    role: "acquisition_manager", seatStatus: "active", accountStatus: "active", planAccess: "team",
    activeStates: ["TX", "FL"], activeCounties: ["Harris"],
    lastLoginAt: ts(1), invitedBy: "demo-user", notes: null, createdAt: ts(300), updatedAt: ts(1),
  },
  {
    id: "user-3", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    name: "Casey Wright", email: "c.wright@demo-estateleados.test", phone: null,
    role: "compliance_reviewer", seatStatus: "active", accountStatus: "active", planAccess: "team",
    activeStates: ["TX", "FL", "NC"], activeCounties: [],
    lastLoginAt: ts(3), invitedBy: "demo-user", notes: null, createdAt: ts(250), updatedAt: ts(3),
  },
  {
    id: "user-4", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    name: "Riley Park", email: "r.park@demo-estateleados.test", phone: null,
    role: "team_member", seatStatus: "active", accountStatus: "active", planAccess: "team",
    activeStates: ["TX"], activeCounties: ["Harris"],
    lastLoginAt: ts(2), invitedBy: "demo-user", notes: null, createdAt: ts(100), updatedAt: ts(2),
  },
  {
    id: "user-ent-1", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    name: "Jordan Blake", email: "j.blake@summit-demo.test", phone: "(555) 200-3001",
    role: "org_admin", seatStatus: "active", accountStatus: "active", planAccess: "enterprise",
    activeStates: ["TX", "FL", "GA"], activeCounties: [],
    lastLoginAt: ts(1), invitedBy: "demo-user", notes: null, createdAt: ts(400), updatedAt: ts(1),
  },
  {
    id: "user-pd-1", organizationId: "demo-org-pastdue", organizationName: "Riverside Lead Co",
    name: "Taylor Chen", email: "t.chen@riverside-demo.test", phone: null,
    role: "org_admin", seatStatus: "active", accountStatus: "past_due_locked", planAccess: "pro",
    activeStates: ["FL"], activeCounties: ["Duval"],
    lastLoginAt: ts(20), invitedBy: null, notes: "Past due locked", createdAt: ts(200), updatedAt: ts(15),
  },
  {
    id: "user-scs-admin", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    name: "Nova Admin", email: "admin@scsnova.test", phone: null,
    role: "scs_nova_admin", seatStatus: "active", accountStatus: "active", planAccess: "team",
    activeStates: [], activeCounties: [],
    lastLoginAt: ts(0), invitedBy: "demo-user", notes: "SCS Nova Admin", createdAt: ts(500), updatedAt: ts(0),
  },
];

export const DEMO_MARKET_LICENSES: MarketLicense[] = [
  {
    id: "lic-1", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    licenseType: "state_license", state: "TX", county: null, city: null, zip: null,
    exclusivePlaceholder: false, leadVolumeLimit: 1000, dataAutomationAccess: true, csvImportAccess: true,
    startDate: ts(365), renewalDate: "2026-06-01", status: "active",
    billingReferencePlaceholder: "sub_demo_tx", notes: null, createdAt: ts(365), updatedAt: ts(2),
  },
  {
    id: "lic-2", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    licenseType: "county_license", state: "TX", county: "Harris", city: "Houston", zip: null,
    exclusivePlaceholder: false, leadVolumeLimit: 500, dataAutomationAccess: true, csvImportAccess: true,
    startDate: ts(300), renewalDate: "2026-06-01", status: "active",
    billingReferencePlaceholder: "sub_demo_harris", notes: null, createdAt: ts(300), updatedAt: ts(2),
  },
  {
    id: "lic-3", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    licenseType: "state_license", state: "FL", county: null, city: null, zip: null,
    exclusivePlaceholder: false, leadVolumeLimit: 800, dataAutomationAccess: true, csvImportAccess: true,
    startDate: ts(200), renewalDate: "2026-03-01", status: "active",
    billingReferencePlaceholder: "sub_demo_fl", notes: null, createdAt: ts(200), updatedAt: ts(5),
  },
  {
    id: "lic-4", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    licenseType: "enterprise_market_license", state: "TX", county: null, city: null, zip: null,
    exclusivePlaceholder: true, leadVolumeLimit: 25000, dataAutomationAccess: true, csvImportAccess: true,
    startDate: ts(400), renewalDate: "2026-12-01", status: "active",
    billingReferencePlaceholder: "ent_tx", notes: "Enterprise nationwide TX", createdAt: ts(400), updatedAt: ts(10),
  },
  {
    id: "lic-5", organizationId: "demo-org-pastdue", organizationName: "Riverside Lead Co",
    licenseType: "county_license", state: "FL", county: "Duval", city: null, zip: null,
    exclusivePlaceholder: false, leadVolumeLimit: 200, dataAutomationAccess: false, csvImportAccess: true,
    startDate: ts(180), renewalDate: "2025-05-01", status: "suspended",
    billingReferencePlaceholder: null, notes: "Suspended — past due", createdAt: ts(180), updatedAt: ts(15),
  },
];

export const DEMO_BILLING_ACCOUNTS: BillingAccount[] = [
  {
    id: "bill-1", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    planId: "team", billingStatus: "active", billingCycle: "annual",
    subscriptionStartDate: ts(365), renewalDate: "2026-06-01", trialEndDate: null,
    seatsPurchased: 10, marketsLicensed: 3, leadPacksPurchased: 0,
    paymentProviderCustomerIdPlaceholder: "cus_demo_gcacq",
    paymentProviderSubscriptionIdPlaceholder: "sub_demo_team_annual",
    invoiceStatus: "paid", pastDueDate: null, cancellationDate: null,
    notes: "Placeholder billing — not live Stripe", createdAt: ts(365), updatedAt: ts(2),
  },
  {
    id: "bill-2", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    planId: "enterprise", billingStatus: "enterprise_invoice", billingCycle: "annual",
    subscriptionStartDate: ts(400), renewalDate: "2026-12-01", trialEndDate: null,
    seatsPurchased: 50, marketsLicensed: 5, leadPacksPurchased: 2,
    paymentProviderCustomerIdPlaceholder: "cus_demo_summit",
    paymentProviderSubscriptionIdPlaceholder: null,
    invoiceStatus: "pending", pastDueDate: null, cancellationDate: null,
    notes: "Enterprise invoice billing", createdAt: ts(400), updatedAt: ts(10),
  },
  {
    id: "bill-3", organizationId: "demo-org-pastdue", organizationName: "Riverside Lead Co",
    planId: "pro", billingStatus: "past_due", billingCycle: "monthly",
    subscriptionStartDate: ts(200), renewalDate: "2025-05-01", trialEndDate: null,
    seatsPurchased: 1, marketsLicensed: 1, leadPacksPurchased: 0,
    paymentProviderCustomerIdPlaceholder: "cus_demo_riverside",
    paymentProviderSubscriptionIdPlaceholder: "sub_demo_pro_monthly",
    invoiceStatus: "past_due", pastDueDate: ts(15), cancellationDate: null,
    notes: "Past due demo account", createdAt: ts(200), updatedAt: ts(15),
  },
];

export const DEMO_USAGE_RECORDS: UsageRecord[] = [
  { id: "use-1", organizationId: "demo-org", usageType: "leads_created", count: 142, periodStart: ts(30), periodEnd: ts(0), relatedPlanLimit: 2000, overLimit: false, percentUsed: 7, createdAt: ts(1), updatedAt: ts(1) },
  { id: "use-2", organizationId: "demo-org", usageType: "csv_imports", count: 18, periodStart: ts(30), periodEnd: ts(0), relatedPlanLimit: 500, overLimit: false, percentUsed: 4, createdAt: ts(1), updatedAt: ts(1) },
  { id: "use-3", organizationId: "demo-org", usageType: "documents_generated", count: 24, periodStart: ts(30), periodEnd: ts(0), relatedPlanLimit: 500, overLimit: false, percentUsed: 5, createdAt: ts(1), updatedAt: ts(1) },
  { id: "use-4", organizationId: "demo-org", usageType: "outreach_logs", count: 38, periodStart: ts(30), periodEnd: ts(0), relatedPlanLimit: 1000, overLimit: false, percentUsed: 4, createdAt: ts(1), updatedAt: ts(1) },
  { id: "use-5", organizationId: "demo-org-trial", usageType: "leads_created", count: 82, periodStart: ts(14), periodEnd: ts(0), relatedPlanLimit: 100, overLimit: false, percentUsed: 82, createdAt: ts(1), updatedAt: ts(1) },
  { id: "use-6", organizationId: "demo-org-trial", usageType: "csv_imports", count: 12, periodStart: ts(14), periodEnd: ts(0), relatedPlanLimit: 25, overLimit: false, percentUsed: 48, createdAt: ts(1), updatedAt: ts(1) },
];

export const DEMO_WHITE_LABEL: WhiteLabelSettings[] = [
  {
    id: "wl-1", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    enabled: true, logoUrlPlaceholder: "/wl/summit-logo.png",
    brandColor: "#1e3a5f", accentColor: "#38bdf8",
    appSubtitle: "Estate Intelligence Platform",
    loginScreenHeadline: "Summit Estate Partners",
    loginScreenSubheadline: "Powered by EstateLeadOS workflow tools",
    emailFooterText: "Summit Estate Partners — Powered by SCS Nova",
    reportBrandingText: "Summit Estate Partners Report",
    documentHeaderText: "Summit Estate Partners — Workflow Document",
    customDomainPlaceholder: "leads.summit-demo.test",
    poweredByScsNovaVisibility: "footer_only",
    approvedByScsNova: true, active: true,
    createdAt: ts(400), updatedAt: ts(10),
  },
  {
    id: "wl-2", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    enabled: false, logoUrlPlaceholder: null, brandColor: "#0ea5e9", accentColor: "#10b981",
    appSubtitle: "", loginScreenHeadline: "", loginScreenSubheadline: "",
    emailFooterText: "", reportBrandingText: "", documentHeaderText: "",
    customDomainPlaceholder: null, poweredByScsNovaVisibility: "always_visible",
    approvedByScsNova: false, active: false,
    createdAt: ts(100), updatedAt: ts(100),
  },
];

export const DEMO_API_KEYS: ApiKeyRecord[] = [
  {
    id: "key-1", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    keyName: "Production API", keyPrefix: "elo_sk_live_••••7f3a",
    permissions: ["read_leads", "read_documents", "read_reports"],
    rateLimit: 1000, createdBy: "user-ent-1", createdAt: ts(60),
    lastUsedAt: ts(1), status: "active", expirationDate: "2026-12-31", notes: "Hashed key stored only",
  },
  {
    id: "key-2", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners",
    keyName: "Staging API", keyPrefix: "elo_sk_test_••••9b2c",
    permissions: ["read_leads"], rateLimit: 100, createdBy: "user-ent-1", createdAt: ts(90),
    lastUsedAt: null, status: "disabled", expirationDate: null, notes: null,
  },
];

export const DEMO_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tkt-1", userId: "user-pd-1", userName: "Taylor Chen",
    organizationId: "demo-org-pastdue", organizationName: "Riverside Lead Co",
    issueType: "billing_issue", relatedLeadId: null, relatedDocumentId: null,
    relatedState: null, relatedCounty: null,
    priority: "billing_critical", status: "open",
    subject: "Account past due — need billing update",
    description: "Payment failed on renewal. Need to update card on file.",
    notes: "Assigned to billing team", assignedAdminId: "demo-user", assignedAdminName: "Alex Morgan",
    createdAt: ts(14), updatedAt: ts(2), closedAt: null,
  },
  {
    id: "tkt-2", userId: "user-2", userName: "Sam Rivera",
    organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    issueType: "data_source_issue", relatedLeadId: "lead-demo-1", relatedDocumentId: null,
    relatedState: "TX", relatedCounty: "Harris",
    priority: "normal", status: "in_review",
    subject: "Harris County connector intermittent failures",
    description: "Deed pull failed twice this week for Harris County records.",
    notes: null, assignedAdminId: "user-scs-admin", assignedAdminName: "Nova Admin",
    createdAt: ts(5), updatedAt: ts(1), closedAt: null,
  },
  {
    id: "tkt-3", userId: "user-3", userName: "Casey Wright",
    organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC",
    issueType: "compliance_question", relatedLeadId: "lead-demo-2", relatedDocumentId: "doc-7",
    relatedState: "FL", relatedCounty: "Duval",
    priority: "compliance_sensitive", status: "waiting_on_scs_nova",
    subject: "FL assignment disclosure template review",
    description: "Need confirmation on assignment disclosure checklist for Duval County.",
    notes: null, assignedAdminId: "user-scs-admin", assignedAdminName: "Nova Admin",
    createdAt: ts(8), updatedAt: ts(3), closedAt: null,
  },
  {
    id: "tkt-4", userId: "user-trial-1", userName: "Morgan Ellis",
    organizationId: "demo-org-trial", organizationName: "Starter Probate Research",
    issueType: "feature_request", relatedLeadId: null, relatedDocumentId: null,
    relatedState: "TX", relatedCounty: null,
    priority: "low", status: "new",
    subject: "Request Deal Calculator access during trial",
    description: "Would like to test Deal Calculator before upgrading to Pro.",
    notes: null, assignedAdminId: null, assignedAdminName: null,
    createdAt: ts(2), updatedAt: ts(2), closedAt: null,
  },
];

export const DEMO_PLATFORM_AUDIT: PlatformAuditLog[] = [
  { id: "pa-1", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC", userId: "demo-user", userName: "Alex Morgan", eventType: "user_role_change", eventCategory: "security", relatedModule: "users", relatedRecordId: "user-3", previousValue: "team_member", newValue: "compliance_reviewer", eventDescription: "Role changed for Casey Wright to Compliance Reviewer", ipDevicePlaceholder: "192.0.2.1", timestamp: ts(30), severity: "security", metadata: null },
  { id: "pa-2", organizationId: "demo-org-pastdue", organizationName: "Riverside Lead Co", userId: "system", userName: "System", eventType: "billing_status_change", eventCategory: "billing", relatedModule: "billing", relatedRecordId: "bill-3", previousValue: "active", newValue: "past_due", eventDescription: "Billing status changed to past due", ipDevicePlaceholder: null, timestamp: ts(15), severity: "warning", metadata: { source: "billing_webhook_placeholder" } },
  { id: "pa-3", organizationId: null, organizationName: null, userId: "demo-user", userName: "Alex Morgan", eventType: "market_license_created", eventCategory: "licensing", relatedModule: "market_licenses", relatedRecordId: "lic-3", previousValue: null, newValue: "FL state license", eventDescription: "Market license created for FL", ipDevicePlaceholder: "192.0.2.1", timestamp: ts(200), severity: "info", metadata: null },
  { id: "pa-4", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners", userId: "demo-user", userName: "Alex Morgan", eventType: "white_label_approved", eventCategory: "white_label", relatedModule: "white_label", relatedRecordId: "wl-1", previousValue: "pending", newValue: "approved", eventDescription: "White-label settings approved for Summit Estate Partners", ipDevicePlaceholder: null, timestamp: ts(390), severity: "notice", metadata: null },
  { id: "pa-5", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC", userId: "user-2", userName: "Sam Rivera", eventType: "lead_created", eventCategory: "leads", relatedModule: "crm", relatedRecordId: "lead-demo-1", previousValue: null, newValue: "created", eventDescription: "Lead created from Harris County discovery", ipDevicePlaceholder: "192.0.2.50", timestamp: ts(60), severity: "info", metadata: null },
  { id: "pa-6", organizationId: "demo-org-enterprise", organizationName: "Summit Estate Partners", userId: "user-ent-1", userName: "Jordan Blake", eventType: "api_key_created", eventCategory: "security", relatedModule: "api_keys", relatedRecordId: "key-1", previousValue: null, newValue: "elo_sk_live_••••7f3a", eventDescription: "API key created — full key not stored in audit", ipDevicePlaceholder: null, timestamp: ts(60), severity: "security", metadata: null },
  { id: "pa-7", organizationId: "demo-org", organizationName: "Gulf Coast Acquisitions LLC", userId: "demo-user", userName: "Alex Morgan", eventType: "document_generated", eventCategory: "documents", relatedModule: "documents", relatedRecordId: "doc-1", previousValue: null, newValue: "generated", eventDescription: "Owner/heir verification checklist generated", ipDevicePlaceholder: "192.0.2.1", timestamp: ts(14), severity: "info", metadata: null },
  { id: "pa-8", organizationId: null, organizationName: null, userId: "demo-user", userName: "Alex Morgan", eventType: "scs_nova_settings_updated", eventCategory: "admin", relatedModule: "scs_nova_settings", relatedRecordId: "settings-1", previousValue: null, newValue: "disclaimer_updated", eventDescription: "Global disclaimer verified — cannot be removed", ipDevicePlaceholder: null, timestamp: ts(90), severity: "compliance", metadata: null },
];

export const DEMO_SYSTEM_HEALTH: SystemHealthRecord[] = [
  { id: "sh-1", statusArea: "Application", status: "operational", message: "All services running", lastCheckedAt: ts(0), relatedLogReference: null, adminNote: null },
  { id: "sh-2", statusArea: "Database", status: "operational", message: "Supabase connection healthy (placeholder)", lastCheckedAt: ts(0), relatedLogReference: "db-health-check", adminNote: null },
  { id: "sh-3", statusArea: "Auth", status: "operational", message: "Authentication service operational", lastCheckedAt: ts(0), relatedLogReference: null, adminNote: null },
  { id: "sh-4", statusArea: "Billing Webhooks", status: "degraded", message: "Stripe webhook placeholder — not live", lastCheckedAt: ts(0), relatedLogReference: "webhook-log", adminNote: "Configure STRIPE_WEBHOOK_SECRET in production" },
  { id: "sh-5", statusArea: "Data Connectors", status: "degraded", message: "2 failed connector runs in last 24h", lastCheckedAt: ts(0), relatedLogReference: "connector-failures", adminNote: "Harris County intermittent" },
  { id: "sh-6", statusArea: "CSV Import", status: "operational", message: "Import queue clear", lastCheckedAt: ts(0), relatedLogReference: null, adminNote: null },
  { id: "sh-7", statusArea: "Document Generation", status: "operational", message: "Template engine operational", lastCheckedAt: ts(0), relatedLogReference: null, adminNote: null },
  { id: "sh-8", statusArea: "API", status: "operational", message: "API placeholder — Enterprise only", lastCheckedAt: ts(0), relatedLogReference: null, adminNote: null },
];

export const DEMO_SCS_NOVA_SETTINGS: ScsNovaSettings = {
  id: "settings-1",
  platformName: "EstateLeadOS",
  poweredByText: "Powered by SCS Nova",
  defaultLogo: "/brand/estateleados-logo.svg",
  defaultAccentColor: "#0ea5e9",
  globalDisclaimerText: GLOBAL_DISCLAIMER,
  defaultSupportEmailPlaceholder: "support@scsnova.test",
  defaultSupportPhonePlaceholder: "(555) 000-SCSN",
  defaultBillingMode: "stripe_ready_placeholder",
  demoModeEnabled: true,
  freshStartModeEnabled: true,
  maintenanceModeEnabled: false,
  defaultDataRetentionPlaceholder: "365 days",
  termsUrlPlaceholder: "https://scsnova.test/terms",
  privacyUrlPlaceholder: "https://scsnova.test/privacy",
  changelogUrlPlaceholder: "https://scsnova.test/changelog",
  roadmapUrlPlaceholder: "https://scsnova.test/roadmap",
  updatedAt: ts(30),
};

export function buildAdminOverview(): AdminOverview {
  return {
    totalOrganizations: DEMO_ORGANIZATIONS.length,
    activeOrganizations: DEMO_ORGANIZATIONS.filter((o) => o.accountStatus === "active" || o.accountStatus === "enterprise").length,
    trialOrganizations: DEMO_ORGANIZATIONS.filter((o) => o.accountStatus === "trial").length,
    suspendedOrganizations: DEMO_ORGANIZATIONS.filter((o) => o.accountStatus === "suspended").length,
    pastDueOrganizations: DEMO_ORGANIZATIONS.filter((o) => o.billingStatus === "past_due").length,
    totalUsers: DEMO_PLATFORM_USERS.length,
    activeUsers: DEMO_PLATFORM_USERS.filter((u) => u.accountStatus === "active").length,
    scsNovaAdmins: DEMO_PLATFORM_USERS.filter((u) => ["scs_nova_super_admin", "scs_nova_admin"].includes(u.role)).length,
    activeSubscriptions: DEMO_BILLING_ACCOUNTS.filter((b) => b.billingStatus === "active" || b.billingStatus === "enterprise_invoice").length,
    mrrPlaceholder: "$12,450 (sample)",
    arrPlaceholder: "$149,400 (sample)",
    marketLicensesActive: DEMO_MARKET_LICENSES.filter((l) => l.status === "active").length,
    statesEnabled: new Set(DEMO_MARKET_LICENSES.filter((l) => l.status === "active").map((l) => l.state)).size,
    countiesEnabled: DEMO_MARKET_LICENSES.filter((l) => l.county && l.status === "active").length,
    dataSourcesActive: 12,
    failedDataPulls: 2,
    complianceBlockersActive: 3,
    documentsNeedingReview: 4,
    supportTicketsOpen: DEMO_SUPPORT_TICKETS.filter((t) => ["new", "open", "in_review", "waiting_on_scs_nova"].includes(t.status)).length,
    whiteLabelClientsActive: DEMO_WHITE_LABEL.filter((w) => w.enabled && w.active).length,
    systemHealthStatus: "operational",
  };
}
