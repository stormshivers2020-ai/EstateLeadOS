import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { getSessionContext } from "@/lib/config/session";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/plans";
import {
  canAccessAdminConsole,
  canAccessAdminSection,
  canManageBilling,
  canManageOrganizations,
  canManageUsers,
} from "@/lib/engines/permission-guard";
import { checkFeatureAccess } from "@/lib/engines/feature-gate";
import { isMarketLicensed } from "@/lib/engines/market-license-guard";
import type { AdminSection, PlatformPlan } from "@/lib/types/platform";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/types/platform";
import { buildAdminOverview } from "@/lib/seed/demo-platform";

const p = () => getDataProvider();
import type { PlanId } from "@/lib/constants/plans";
import type { UserRoleId } from "@/lib/constants/roles";

export function getAdminOverview() {
  return shouldLoadSeedData() ? buildAdminOverview() : {
    totalOrganizations: 0, activeOrganizations: 0, trialOrganizations: 0,
    suspendedOrganizations: 0, pastDueOrganizations: 0, totalUsers: 0, activeUsers: 0,
    scsNovaAdmins: 0, activeSubscriptions: 0, mrrPlaceholder: "—", arrPlaceholder: "—",
    marketLicensesActive: 0, statesEnabled: 0, countiesEnabled: 0, dataSourcesActive: 0,
    failedDataPulls: 0, complianceBlockersActive: 0, documentsNeedingReview: 0,
    supportTicketsOpen: 0, whiteLabelClientsActive: 0, systemHealthStatus: "unknown" as const,
  };
}

export function getOrganizations() {
  return shouldLoadSeedData() ? p().platform.getOrganizations() : [];
}

export function getOrganizationById(id: string) {
  return getOrganizations().find((o) => o.id === id) ?? null;
}

export function getPlatformUsers(orgId?: string) {
  const users = shouldLoadSeedData() ? p().platform.getUsers() : [];
  return orgId ? users.filter((u) => u.organizationId === orgId) : users;
}

export function getPlatformPlans(): PlatformPlan[] {
  return SUBSCRIPTION_PLANS.map((p) => ({
    id: p.id,
    planName: p.name,
    description: p.features.join(", "),
    monthlyPricePlaceholder: p.priceMonthly,
    annualPricePlaceholder: p.priceAnnual,
    seatLimit: p.limits.seats,
    leadLimit: p.limits.monthlyLeads,
    stateLimit: p.limits.states,
    countyLimit: null,
    importLimit: null,
    exportLimit: null,
    features: {
      dealCalculator: p.limits.dealCalculator,
      outreachTools: p.limits.outreachTools,
      stateDealKits: p.limits.stateDealKits,
      buyerNetwork: p.limits.buyerNetwork,
      assignmentTracker: p.limits.assignmentTracker,
      auditTrail: p.limits.auditTrail,
      advancedReporting: p.limits.advancedReporting,
      apiAccess: p.limits.apiAccess,
      whiteLabel: p.limits.whiteLabel,
      marketSearch: p.limits.stateDealKits,
      leadFeed: true,
      documentCenter: p.limits.stateDealKits,
      complianceCenter: p.limits.stateDealKits,
    },
    supportLevel: p.id === "enterprise" ? "dedicated" : p.id === "team" ? "priority" : "standard",
    active: true,
  }));
}

export function getMarketLicenses(orgId?: string) {
  const licenses = shouldLoadSeedData() ? p().platform.getMarketLicenses() : [];
  return orgId ? licenses.filter((l) => l.organizationId === orgId) : licenses;
}

export function getBillingAccounts(orgId?: string) {
  const accounts = shouldLoadSeedData() ? p().platform.getBillingAccounts() : [];
  return orgId ? accounts.filter((a) => a.organizationId === orgId) : accounts;
}

export function getUsageRecords(orgId?: string) {
  const records = shouldLoadSeedData() ? p().platform.getUsageRecords() : [];
  return orgId ? records.filter((r) => r.organizationId === orgId) : records;
}

export function getWhiteLabelSettings(orgId?: string) {
  const settings = shouldLoadSeedData() ? p().platform.getWhiteLabel() : [];
  return orgId ? settings.filter((s) => s.organizationId === orgId) : settings;
}

export function getApiKeys(orgId?: string) {
  const keys = shouldLoadSeedData() ? p().platform.getApiKeys() : [];
  return orgId ? keys.filter((k) => k.organizationId === orgId) : keys;
}

export function getSupportTickets(orgId?: string) {
  const tickets = shouldLoadSeedData() ? p().platform.getSupportTickets() : [];
  return orgId ? tickets.filter((t) => t.organizationId === orgId) : tickets;
}

export function getPlatformAuditLogs(filters?: {
  organizationId?: string;
  category?: string;
  severity?: string;
}) {
  let logs = shouldLoadSeedData() ? [...p().platform.getPlatformAudit()] : [];
  if (filters?.organizationId) logs = logs.filter((l) => l.organizationId === filters.organizationId);
  if (filters?.category) logs = logs.filter((l) => l.eventCategory === filters.category);
  if (filters?.severity) logs = logs.filter((l) => l.severity === filters.severity);
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getSystemHealth() {
  return shouldLoadSeedData() ? p().platform.getSystemHealth() : [];
}

export function getScsNovaSettings() {
  const defaults = p().platform.getScsNovaSettings();
  return shouldLoadSeedData() ? defaults : {
    ...defaults,
    demoModeEnabled: false,
    freshStartModeEnabled: true,
  };
}

export function checkAdminAccess(section: AdminSection, role?: UserRoleId): {
  allowed: boolean;
  message: string;
} {
  const r = role ?? getSessionContext().role;
  if (!canAccessAdminConsole(r)) {
    return { allowed: false, message: PERMISSION_DENIED_MESSAGE };
  }
  if (!canAccessAdminSection(r, section)) {
    return { allowed: false, message: PERMISSION_DENIED_MESSAGE };
  }
  return { allowed: true, message: "" };
}

export function checkOrgFeature(planId: PlanId, feature: Parameters<typeof checkFeatureAccess>[1]) {
  return checkFeatureAccess(planId, feature);
}

export function checkOrgMarketAccess(organizationId: string, state: string, county?: string) {
  return isMarketLicensed(getMarketLicenses(), organizationId, state, county);
}

export function getAdminPermissions(role?: UserRoleId) {
  const r = role ?? getSessionContext().role;
  return {
    canAccessConsole: canAccessAdminConsole(r),
    canManageUsers: canManageUsers(r),
    canManageOrgs: canManageOrganizations(r),
    canViewBilling: canManageBilling(r, "view"),
    canManageBilling: canManageBilling(r, "manage"),
  };
}

export function getAdminReports() {
  const orgs = getOrganizations();
  const plans = getPlatformPlans();
  return {
    organizationsByPlan: plans.map((p) => ({
      plan: p.planName,
      count: orgs.filter((o) => o.planId === p.id).length,
    })),
    pastDueCount: orgs.filter((o) => o.billingStatus === "past_due").length,
    trialCount: orgs.filter((o) => o.accountStatus === "trial").length,
    whiteLabelCount: getWhiteLabelSettings().filter((w) => w.enabled).length,
    openTickets: getSupportTickets().filter((t) => !["closed", "archived", "resolved"].includes(t.status)).length,
    revenuePlaceholder: "$12,450 MRR (sample billing architecture)",
  };
}
