export { getDashboardMetrics } from "./dashboard";
export { MODULE_REGISTRY } from "./modules";
export {
  getStateProfiles,
  getStateProfile,
  getCountiesForState,
  buildStateDealKit,
  runLeadComplianceCheck,
  getComplianceOverview,
  getActiveBlockers,
  getLeadComplianceContext,
} from "./compliance";
export {
  getFullLeadById,
  getDemoLeadsSummary,
  getLeadSummary,
  getPipelineCards,
  validateLeadStageChange,
  getOutreachOverview,
} from "./crm/server";
export {
  getCommunicationLogs,
  getFollowUps,
  getLeadNotes,
  getCrmAuditEvents,
} from "./crm";
export { getOutreachTemplates, checkTemplateSafety, DNC_REMINDER_TEXT } from "./outreach";

// Phase 2+ module placeholders
export {
  discoverLeadsFromInternet,
  isInternetSearchConfigured,
  getPendingInternetLeads,
  approveInternetLead,
  rejectInternetLead,
  leadDiscoveryService,
} from "./lead-discovery";
export type { InternetLeadDiscoveryResult, InternetLeadSearchInput } from "./lead-discovery";

export const complianceService = {
  id: "compliance-engine",
  status: "placeholder" as const,
  description: "State compliance rules engine — Phase 3",
};

export {
  getDocumentTypes,
  getDocuments,
  getDocumentById,
  getDocumentCenterOverview,
  getLeadPacket,
  getLeadPackets,
  getUploadedDocuments,
  getAttorneyReviewQueue,
  getDocumentAuditLogs,
  getDocumentBlockers,
  getStarterTemplates,
  runDocumentGeneration,
  buildDealKitDocuments,
  validateDocumentStageChange,
} from "./documents";

export const outreachService = {
  id: "outreach-crm",
  status: "placeholder" as const,
  description: "Outreach CRM and communication logs — Phase 4",
};

export {
  getDealCalculations,
  getLatestCalculation,
  runCalculatorForLead,
  getDealPotentialScore,
  computeDealPotentialForLead,
} from "./deal-calculator";
export {
  getBuyers,
  getBuyerById,
  getBuyerMatchesForLead,
  getBuyerNetworkOverview,
  getBuyerOutreachTemplates,
  validateBuyerMatchingForLead,
} from "./buyers";
export {
  getAssignments,
  getAssignmentById,
  getAssignmentForLead,
  validateAssignmentStage,
  getAssignmentOverview,
} from "./assignments";
export { getPhase6Reports } from "./reports";

export {
  getAdminOverview,
  getOrganizations,
  getPlatformUsers,
  getMarketLicenses,
  checkAdminAccess,
  checkOrgFeature,
  checkOrgMarketAccess,
  getPlatformAuditLogs,
  getSupportTickets,
  getScsNovaSettings,
  getSystemHealth,
} from "./admin";
export { getOrganizationUsageSummary, isOrganizationOverLimit } from "./usage";
