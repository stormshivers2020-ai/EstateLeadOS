export {
  getAutomationState,
  startAutomation,
  pauseAutomation,
  stopAutomation,
  resumeAutomation,
  approveAndResume,
  approveLeadDiscoveryWithLeadId,
  rejectApproval,
  processAutomationRun,
  getAutomationLogs,
  getPendingApprovals,
} from "./automationEngine";

export type {
  AutomationRun,
  AutomationStep,
  AutomationApproval,
  AutomationLog,
  AutomationState,
  AutomationType,
  AutomationStatus,
  PayoutReadiness,
} from "./automationTypes";

export { AUTOMATION_TYPE_LABELS } from "./automationTypes";
export { buttonLabelForStatus as getAutomationButtonLabel } from "./automationStateMachine";
export { PAYOUT_STATUS_LABELS } from "./automationPayoutReadiness";
export { checkAutomationAccess } from "./automationPermissions";
export { canRoleApprove } from "./automationApprovalGate";
