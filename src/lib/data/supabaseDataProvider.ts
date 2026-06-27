import type { DataProvider } from "./dataProvider";
import { FRESH_START_DASHBOARD_METRICS } from "@/lib/seed/demo-dashboard";

const NOT_CONNECTED_MSG =
  "Supabase provider is not fully connected yet. Switch NEXT_PUBLIC_DATA_PROVIDER=local to continue previewing locally.";

function stub<T>(fallback: T): T {
  return fallback;
}

function createSupabaseProvider(): DataProvider {
  const empty = {
    crm: {
      getFullLeads: () => { console.warn(NOT_CONNECTED_MSG); return []; },
      getCommunicationLogs: () => [],
      getFollowUps: () => [],
      getDncRecords: () => [],
      getNotes: () => [],
      getAuditEvents: () => [],
      updateLeadStage: () => { console.warn(NOT_CONNECTED_MSG); return false; },
      addNote: () => { throw new Error(NOT_CONNECTED_MSG); },
    },
    dashboard: { getMetrics: () => stub(FRESH_START_DASHBOARD_METRICS) },
    platform: {
      getOrganizations: () => [],
      getUsers: () => [],
      getMarketLicenses: () => [],
      getBillingAccounts: () => [],
      getUsageRecords: () => [],
      getSupportTickets: () => [],
      getPlatformAudit: () => [],
      getSystemHealth: () => [],
      getScsNovaSettings: () => stub({
        id: "scs-1", platformName: "EstateLeadOS", poweredByText: "SCS Nova",
        defaultLogo: "/brand/estateleados-logo.svg", defaultAccentColor: "#0ea5e9",
        globalDisclaimerText: "", defaultSupportEmailPlaceholder: "support@estateleados.com",
        defaultSupportPhonePlaceholder: "(555) 000-0000", defaultBillingMode: "subscription",
        demoModeEnabled: false, freshStartModeEnabled: true, maintenanceModeEnabled: false,
        defaultDataRetentionPlaceholder: "365 days", termsUrlPlaceholder: "/terms",
        privacyUrlPlaceholder: "/privacy", changelogUrlPlaceholder: "/changelog",
        roadmapUrlPlaceholder: "/roadmap", updatedAt: new Date().toISOString(),
      }),
      getWhiteLabel: () => [],
      getApiKeys: () => [],
    },
    documents: {
      getRecords: () => [],
      getPackets: () => [],
      getUploads: () => [],
      getAttorneyQueue: () => [],
      getAudit: () => [],
    },
    compliance: {
      getCounties: () => [],
      getBlockers: () => [],
      getAcknowledgements: () => [],
      getLeadCompliance: () => [],
    },
    dealWorkflow: {
      getBuyers: () => [],
      getBuyerMatches: () => [],
      getAssignments: () => [],
      getCalculations: () => [],
    },
    import: { getBatches: () => [] },
    connector: { getLogs: () => [] },
  };

  return {
    type: "supabase",
    shouldLoadSeedData: () => false,
    isDemoMode: () => false,
    ...empty,
  };
}

let supabaseProvider: DataProvider | null = null;

export function getSupabaseDataProvider(): DataProvider {
  if (!supabaseProvider) supabaseProvider = createSupabaseProvider();
  return supabaseProvider;
}
