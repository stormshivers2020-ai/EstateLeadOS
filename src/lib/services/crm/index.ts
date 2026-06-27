/** Client-safe CRM helpers (no Supabase server imports). */
export {
  getFullLeadByIdSync,
  getFullLeadsSync,
  getDemoLeadsSummarySync,
  getCommunicationLogs,
  getFollowUps,
  getDncRecords,
  getLeadNotes,
  getCrmAuditEvents,
  getFollowUpsDue,
  getBlockedTemplateExample,
  getPipelineCardsSync,
  validateLeadStageChangeSync,
  getOutreachOverviewSync,
} from "./sync";
