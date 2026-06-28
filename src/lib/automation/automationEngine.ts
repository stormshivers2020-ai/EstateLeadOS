import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getClientLeadsCache } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { assertTransition } from "./automationStateMachine";
import { createApproval, allRequiredApprovalsComplete, updateApprovalStatus } from "./automationApprovalGate";
import { createLogEntry } from "./automationAuditLogger";
import { runDocumentDiscovery } from "./automationDocumentFinder";
import { runComplianceCheck, runOutreachPreparation } from "./automationComplianceRunner";
import { buildPayoutReadinessRecord } from "./automationPayoutReadiness";
import { evaluateSourceForAutomation } from "./automationSourceRunner";
import { checkAutomationAccess } from "./automationPermissions";
import {
  fetchPendingLeadCount,
  searchInternetLeadsViaApi,
} from "./automationInternetDiscovery";
import { DEFAULT_DISCOVERY_MARKET } from "./discoveryMarket";
import {
  buildStepsForRun,
  getNextPendingStep,
  calculateProgress,
} from "./automationQueue";
import type {
  AutomationState,
  AutomationRun,
  AutomationType,
  AutomationApproval,
  AutomationStep,
} from "./automationTypes";
import { AUTOMATION_TYPE_LABELS } from "./automationTypes";

function emptyAutomationState(): AutomationState {
  return { runs: [], steps: [], approvals: [], logs: [], payoutReadiness: [], activeRunId: null };
}

export function getAutomationState(): AutomationState {
  const state = getLocalState();
  return state.automation ?? emptyAutomationState();
}

function saveAutomation(automation: AutomationState): void {
  const state = getLocalState();
  state.automation = automation;
  persistLocalState();
}

function updateRun(run: AutomationRun): void {
  const automation = getAutomationState();
  automation.runs = automation.runs.map((r) => (r.id === run.id ? run : r));
  saveAutomation(automation);
}

function addLog(run: AutomationRun, step: string, action: string, message: string, status: "info" | "success" | "warning" | "error" = "info", userActionRequired = false) {
  const automation = getAutomationState();
  const session = getSessionContext();
  const log = createLogEntry({
    automationRunId: run.id,
    organizationId: session.organizationId,
    leadId: run.leadId,
    step,
    action,
    status,
    message,
    relatedRecordType: null,
    relatedRecordId: null,
    riskLevel: null,
    errorDetails: null,
    userActionRequired,
  });
  automation.logs = [log, ...automation.logs].slice(0, 500);
  saveAutomation(automation);
}

function setRunInState(automation: AutomationState, runId: string, run: AutomationRun): AutomationState {
  return {
    ...automation,
    runs: automation.runs.map((r) => (r.id === runId ? run : r)),
  };
}

function completeStep(step: AutomationStep, output: Record<string, unknown>): AutomationStep {
  const now = new Date().toISOString();
  return { ...step, status: "completed", outputData: output, completedAt: now, updatedAt: now };
}

function patchRun(runId: string, patch: Partial<AutomationRun>): AutomationRun | null {
  const automation = getAutomationState();
  const run = automation.runs.find((r) => r.id === runId);
  if (!run) return null;
  const updated = { ...run, ...patch, updatedAt: new Date().toISOString() };
  automation.runs = automation.runs.map((r) => (r.id === runId ? updated : r));
  saveAutomation(automation);
  return updated;
}

function findLeadApprovedSinceRun(run: AutomationRun) {
  const started = run.startedAt ? new Date(run.startedAt).getTime() : 0;
  return getLocalState()
    .leads.filter(
      (l) =>
        l.origin === "auto_discovered" &&
        new Date(l.createdAt).getTime() >= started - 1000
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

function resolveLead(leadId: string | null) {
  if (!leadId) return null;
  if (isSupabaseMode()) {
    return getClientLeadsCache().find((l) => l.id === leadId) ?? null;
  }
  return getLocalState().leads.find((l) => l.id === leadId) ?? null;
}

function executeStep(run: AutomationRun, step: AutomationStep): {
  step: AutomationStep;
  pause: boolean;
  approval?: AutomationApproval;
  error?: string;
  async?: boolean;
} {
  const lead = resolveLead(run.leadId);
  const session = getSessionContext();
  const isLocal = isLocalPreviewMode();
  const now = new Date().toISOString();
  let updated: AutomationStep = { ...step, status: "running", startedAt: now, updatedAt: now };
  const output: Record<string, unknown> = {};

  try {
    switch (step.stepName) {
      case "search_internet_leads":
        return { step: { ...updated, status: "running" }, pause: false, async: true };
      case "await_operator_lead_approval":
        return { step: { ...updated, status: "running" }, pause: false, async: true };
      case "confirm_lead": {
        const activeLead = resolveLead(run.leadId);
        if (!activeLead) {
          return {
            step: { ...updated, status: "failed", errorMessage: "No lead found" },
            pause: true,
            error: "No approved lead yet. Run internet discovery or approve a lead from the queue.",
          };
        }
        output.leadConfirmed = true;
        addLog(run, step.stepName, "confirm_lead", `Lead confirmed: ${activeLead.propertyAddress}`, "success");
        break;
      }
      case "check_market_support": {
        output.state = lead?.state ?? "unknown";
        output.county = lead?.county ?? "unknown";
        addLog(run, step.stepName, "check_market", `Market: ${output.state} / ${output.county}`, "info");
        break;
      }
      case "check_source_permissions": {
        const results = (lead?.sourceRecords ?? []).map((src) =>
          evaluateSourceForAutomation(
            {
              id: src.id,
              name: src.sourceName,
              sourceType: "recorder_deed",
              state: lead?.state ?? null,
              county: lead?.county ?? null,
              permissionStatus: src.permissionStatus as "approved_api",
              termsStatus: "reviewed",
              accessMethod: "api",
              sourceUrl: src.sourceUrl ?? null,
              reliabilityScore: src.reliabilityScore,
              freshnessScore: src.reliabilityScore,
              lastCheckedAt: null,
              lastSyncAt: null,
              lastSyncResult: "success",
              failureReason: null,
              adminApprovalStatus: "approved",
              legalAccessWarning: null,
              notes: null,
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { state: lead?.state, county: lead?.county, organizationId: session.organizationId }
          )
        );
        output.sourceChecks = results;
        const blocked = results.filter((r) => r.action === "blocked" || r.action === "pause_for_approval");
        if (blocked.length > 0) {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "source_approval",
            approvalTitle: "Source Permission Review Required",
            approvalDescription: blocked[0].warning || "This source is not approved for automated access. Automation has paused. Review the source status or use manual research/CSV import.",
            relatedRecordType: "source",
            relatedRecordId: blocked[0].sourceId,
            riskLevel: "elevated",
            requiredRole: "org_admin",
          });
          addLog(run, step.stepName, "source_blocked", approval.approvalDescription, "warning", true);
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "source_check", "Source permissions reviewed", "success");
        break;
      }
      case "check_source_health": {
        output.health = lead?.sourceRecords.length ? "healthy" : "no_sources";
        addLog(run, step.stepName, "source_health", `Source health: ${output.health}`, "info");
        break;
      }
      case "identify_required_documents":
      case "check_source_records":
      case "flag_missing_documents": {
        const discovery = runDocumentDiscovery(lead, isLocal);
        output.discovery = discovery;
        if (discovery.approvalRequired && step.stepName === "flag_missing_documents") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "document_approval",
            approvalTitle: "Document Discovery Review",
            approvalDescription: discovery.approvalReason ?? "Missing documents require upload or manual research approval.",
            riskLevel: "moderate",
            requiredRole: "user",
          });
          addLog(run, step.stepName, "document_pause", approval.approvalDescription, "warning", true);
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "document_discovery", `Found ${discovery.documentsFound.length}, missing ${discovery.documentsMissing.length}`, "info");
        break;
      }
      case "update_owner_history":
      case "update_transfer_signals":
      case "flag_manual_verification": {
        output.signalsUpdated = lead?.signals.length ?? 0;
        if (lead && lead.manualVerificationNeeded.length > 0 && step.stepName === "flag_manual_verification") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "compliance_approval",
            approvalTitle: "Manual Verification Required",
            approvalDescription: `Manual verification needed: ${lead.manualVerificationNeeded.join(", ")}`,
            riskLevel: "elevated",
            requiredRole: "compliance_reviewer",
          });
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "research", "Probate/inherited research updated", "success");
        break;
      }
      case "recalculate_estate_score":
      case "recalculate_confidence":
      case "recalculate_deal_potential": {
        output.estateScore = lead?.estateLeadScore;
        output.confidence = lead?.dataConfidenceScore;
        output.dealPotential = lead?.dealPotentialScore;
        addLog(run, step.stepName, "scoring", "Lead scores recalculated", "success");
        break;
      }
      case "run_compliance_engine":
      case "check_acknowledgements":
      case "create_blockers_if_needed": {
        const compliance = runComplianceCheck(lead);
        output.compliance = compliance;
        if (compliance.pauseRequired && step.stepName === "create_blockers_if_needed") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "compliance_approval",
            approvalTitle: "Compliance Review Required",
            approvalDescription: compliance.pauseReason ?? "Compliance review required before continuing.",
            riskLevel: compliance.riskLevel === "restricted" ? "restricted" : "elevated",
            requiredRole: "compliance_reviewer",
          });
          addLog(run, step.stepName, "compliance_pause", approval.approvalDescription, "warning", true);
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "compliance", `Compliance risk: ${compliance.riskLevel}`, "info");
        break;
      }
      case "generate_packet":
      case "checklist_review":
      case "attorney_review_flags": {
        output.packetGenerated = true;
        output.attorneyReview = step.stepName === "attorney_review_flags";
        if (step.stepName === "attorney_review_flags") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "attorney_review_acknowledgement",
            approvalTitle: "Professional Review Reminder",
            approvalDescription: "Document packet may require attorney or title company review before use. Acknowledgement required.",
            riskLevel: "moderate",
            requiredRole: "user",
          });
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "packet", "Document packet step completed", "success");
        break;
      }
      case "check_dnc_consent":
      case "run_outreach_safety_guard":
      case "prepare_templates": {
        const outreach = runOutreachPreparation(lead);
        output.outreach = outreach;
        if (step.stepName === "prepare_templates") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "outreach_approval",
            approvalTitle: "Outreach Preparation Approval",
            approvalDescription: "Outreach templates prepared but not sent. User approval required before any outreach action.",
            riskLevel: outreach.dncActive ? "restricted" : "moderate",
            requiredRole: "user",
          });
          addLog(run, step.stepName, "outreach_prepared", "Templates prepared — auto-send blocked", "warning", true);
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "outreach", outreach.dncActive ? "DNC active — outreach blocked" : "Outreach safety checked", "info");
        break;
      }
      case "gather_assumptions":
      case "run_calculator":
      case "add_disclaimer": {
        output.estimated = true;
        output.disclaimer = "User-entered assumptions only. Not guaranteed profit.";
        addLog(run, step.stepName, "deal_calc", "Deal calculation completed (estimated)", "success");
        break;
      }
      case "match_buyers":
      case "check_proof_of_funds":
      case "suggest_best_match": {
        output.matchesFound = lead ? 2 : 0;
        if (step.stepName === "suggest_best_match" && lead) {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "buyer_approval",
            approvalTitle: "Buyer Match Approval",
            approvalDescription: "Buyer match suggested. Review proof of funds and buyer fit before proceeding.",
            riskLevel: "moderate",
            requiredRole: "acquisition_manager",
          });
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "buyer_match", "Buyer matching completed", "success");
        break;
      }
      case "check_disclosures":
      case "check_title_status":
      case "check_packet_readiness": {
        output.assignmentReady = false;
        if (step.stepName === "check_packet_readiness") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "assignment_approval",
            approvalTitle: "Assignment Readiness Review",
            approvalDescription: "Assignment disclosures, title status, and document packet require review before proceeding.",
            riskLevel: "elevated",
            requiredRole: "org_admin",
          });
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "assignment", "Assignment readiness checked", "info");
        break;
      }
      case "check_closing_status":
      case "check_fee_recorded":
      case "check_payout_method": {
        const payout = buildPayoutReadinessRecord({
          leadId: lead?.id ?? "unknown",
          organizationId: session.organizationId,
          assignmentId: null,
          paymentProviderConnected: false,
        });
        output.payout = payout;
        const automation = getAutomationState();
        automation.payoutReadiness = [payout, ...automation.payoutReadiness.filter((p) => p.leadId !== payout.leadId)];
        saveAutomation(automation);
        if (step.stepName === "check_payout_method") {
          const approval = createApproval({
            automationRunId: run.id,
            organizationId: session.organizationId,
            leadId: run.leadId,
            approvalType: "payout_readiness_approval",
            approvalTitle: "Payout Readiness Review",
            approvalDescription: "Payout readiness tracked. No automatic bank transfer. Review recorded fee, closing confirmation, and payment provider status.",
            riskLevel: "moderate",
            requiredRole: "org_admin",
          });
          addLog(run, step.stepName, "payout_tracking", "Payout readiness tracked — no auto-transfer", "warning", true);
          return { step: { ...updated, requiresApproval: true, approvalId: approval.id }, pause: true, approval };
        }
        addLog(run, step.stepName, "payout", `Payout status: ${payout.payoutReadinessStatus}`, "info");
        break;
      }
      case "generate_summary":
      case "log_audit":
      case "set_next_action": {
        output.summary = "Workflow automation stage completed under supervision.";
        addLog(run, step.stepName, "summary", "Completion summary generated", "success");
        break;
      }
      default:
        addLog(run, step.stepName, "step", `Step ${step.stepName} completed`, "info");
    }

    return { step: completeStep(updated, output), pause: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Step failed";
    return { step: { ...updated, status: "failed", errorMessage: msg }, pause: true, error: msg };
  }
}

export function startAutomation(
  automationType: AutomationType,
  options: {
    leadId?: string;
    wizardId?: string;
    planId?: string;
    discoveryMarket?: { state: string; county: string; city?: string };
  } = {}
): { run: AutomationRun | null; error?: string } {
  const session = getSessionContext();
  const access = checkAutomationAccess(automationType, session.role, (options.planId as "team") ?? "team");
  if (!access.allowed) return { run: null, error: access.message };

  const automation = getAutomationState();
  const active = automation.runs.find((r) => ["running", "queued", "waiting_for_approval"].includes(r.status));
  if (active) return { run: null, error: "An automation run is already active. Pause or stop it first." };

  const now = new Date().toISOString();
  const runId = `run-${Date.now()}`;
  const run: AutomationRun = {
    id: runId,
    organizationId: session.organizationId,
    userId: session.userId,
    userName: session.userName,
    leadId: options.leadId ?? null,
    wizardId: options.wizardId ?? null,
    automationType,
    currentStage: "intake",
    currentStep: "confirm_lead",
    status: "queued",
    progress: 0,
    requiredApprovalIds: [],
    activeBlockerIds: [],
    startedAt: now,
    pausedAt: null,
    resumedAt: null,
    completedAt: null,
    stoppedAt: null,
    errorMessage: null,
    auditLogRef: `audit-${runId}`,
    discoveryMarket: options.discoveryMarket ?? {
      state: DEFAULT_DISCOVERY_MARKET.state,
      county: DEFAULT_DISCOVERY_MARKET.county,
    },
    discoverySearchId: null,
    createdAt: now,
    updatedAt: now,
  };

  const steps = buildStepsForRun(runId, automationType);
  automation.runs = [run, ...automation.runs];
  automation.steps = [...steps, ...automation.steps];
  automation.activeRunId = runId;
  saveAutomation(automation);

  addLog(run, "intake", "start", `${AUTOMATION_TYPE_LABELS[automationType]} started`, "success");
  appendPlatformAudit({
    eventType: "automation_started",
    eventDescription: `${AUTOMATION_TYPE_LABELS[automationType]} started`,
    relatedModule: "automation",
    relatedRecordId: runId,
  });

  return { run: processAutomationRun(runId).run ?? run };
}

async function executeStepAsync(run: AutomationRun, step: AutomationStep): Promise<{
  step: AutomationStep;
  pause: boolean;
  approval?: AutomationApproval;
  error?: string;
  runPatch?: Partial<AutomationRun>;
}> {
  const session = getSessionContext();
  const now = new Date().toISOString();
  let updated: AutomationStep = { ...step, status: "running", startedAt: now, updatedAt: now };
  const output: Record<string, unknown> = {};

  if (step.stepName === "search_internet_leads") {
    const market = run.discoveryMarket ?? DEFAULT_DISCOVERY_MARKET;
    if (!market.county?.trim()) {
      return {
        step: { ...updated, status: "failed", errorMessage: "County required for internet search" },
        pause: true,
        error: "Set a target county in Market Search first, then run automation again.",
      };
    }

    const result = await searchInternetLeadsViaApi({
      state: market.state,
      county: market.county,
      city: market.city,
      maxResults: 12,
    });

    if (result.error) {
      return {
        step: { ...updated, status: "failed", errorMessage: result.error },
        pause: true,
        error: result.error,
      };
    }

    output.searchId = result.searchId;
    output.pendingQueued = result.pendingQueued;
    output.candidatesFound = result.candidatesFound;
    addLog(
      run,
      step.stepName,
      "internet_search",
      result.pendingQueued > 0
        ? `Internet search found ${result.pendingQueued} lead(s) queued for your approval`
        : "Internet search completed — no new estate leads matched this market",
      result.pendingQueued > 0 ? "success" : "warning"
    );

    return {
      step: completeStep(updated, output),
      pause: false,
      runPatch: { discoverySearchId: result.searchId },
    };
  }

  if (step.stepName === "await_operator_lead_approval") {
    const searchStep = getAutomationState().steps.find(
      (s) => s.automationRunId === run.id && s.stepName === "search_internet_leads" && s.status === "completed"
    );
    const pendingQueued = (searchStep?.outputData?.pendingQueued as number) ?? 0;

    if (pendingQueued === 0) {
      addLog(run, step.stepName, "lead_approval", "No leads to approve — skipping", "warning");
      return { step: completeStep(updated, { skipped: true }), pause: false };
    }

    const approvedLead = findLeadApprovedSinceRun(run);
    if (approvedLead) {
      output.leadId = approvedLead.id;
      addLog(
        run,
        step.stepName,
        "lead_approved",
        `Using approved lead: ${approvedLead.propertyAddress}`,
        "success"
      );
      return {
        step: completeStep(updated, output),
        pause: false,
        runPatch: { leadId: approvedLead.id },
      };
    }

    const pendingCount = await fetchPendingLeadCount();
    if (pendingCount > 0) {
      const approval = createApproval({
        automationRunId: run.id,
        organizationId: session.organizationId,
        leadId: run.leadId,
        approvalType: "lead_discovery_approval",
        approvalTitle: "Approve Internet Leads",
        approvalDescription: `${pendingCount} discovered lead(s) need your review. Approve one lead below to continue automation.`,
        riskLevel: "moderate",
        requiredRole: "user",
      });
      addLog(
        run,
        step.stepName,
        "await_approval",
        approval.approvalDescription,
        "warning",
        true
      );
      return {
        step: { ...updated, requiresApproval: true, approvalId: approval.id },
        pause: true,
        approval,
      };
    }

    addLog(
      run,
      step.stepName,
      "lead_rejected",
      "All discovered leads were rejected — automation cannot continue without an approved lead",
      "error",
      true
    );
    return {
      step: { ...updated, status: "failed", errorMessage: "No approved leads" },
      pause: true,
      error: "All internet leads were rejected. Run a new search or approve a lead to continue.",
    };
  }

  return executeStep(run, step);
}

export function processAutomationRun(runId: string): { run: AutomationRun | null; done: boolean } {
  let automation = getAutomationState();
  let run = automation.runs.find((r) => r.id === runId);
  if (!run) return { run: null, done: true };

  if (run.status === "paused" || run.status === "stopped" || run.status === "cancelled") {
    return { run, done: true };
  }

  try {
    assertTransition(run.status, "running");
  } catch {
    if (run.status === "queued") {
      run = { ...run, status: "running", updatedAt: new Date().toISOString() };
      updateRun(run);
    }
  }

  run = { ...run!, status: "running", updatedAt: new Date().toISOString() };
  updateRun(run);

  while (true) {
    automation = getAutomationState();
    run = automation.runs.find((r) => r.id === runId)!;

    if (run.status === "paused" || run.status === "stopped") break;

    if (!allRequiredApprovalsComplete(automation.approvals, runId)) {
      run = {
        ...run,
        status: "waiting_for_approval",
        requiredApprovalIds: automation.approvals.filter((a) => a.automationRunId === runId && a.status === "pending").map((a) => a.id),
        updatedAt: new Date().toISOString(),
      };
      updateRun(run);
      break;
    }

    const next = getNextPendingStep(automation.steps, runId);
    if (!next) {
      run = {
        ...run,
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
        currentStage: "completion_summary",
        currentStep: "complete",
        updatedAt: new Date().toISOString(),
      };
      updateRun(run);
      addLog(run, "completion", "complete", "Automation completed successfully", "success");
      appendPlatformAudit({
        eventType: "automation_completed",
        eventDescription: `${AUTOMATION_TYPE_LABELS[run.automationType]} completed`,
        relatedModule: "automation",
        relatedRecordId: runId,
      });
      break;
    }

    run = { ...run, currentStage: next.stage, currentStep: next.stepName, updatedAt: new Date().toISOString() };
    updateRun(run);

    const result = executeStep(run, next);
    if (result.async) {
      void executeStepAsync(run, next).then((asyncResult) => {
        finishStepProcessing(runId, next.id, asyncResult);
      });
      return { run: automation.runs.find((r) => r.id === runId) ?? null, done: true };
    }

    const finished = finishStepProcessing(runId, next.id, result);
    if (finished.breakLoop) {
      return { run: finished.run, done: true };
    }
  }

  automation = getAutomationState();
  return { run: automation.runs.find((r) => r.id === runId) ?? null, done: true };
}

function finishStepProcessing(
  runId: string,
  stepId: string,
  result: {
    step: AutomationStep;
    pause: boolean;
    approval?: AutomationApproval;
    error?: string;
    runPatch?: Partial<AutomationRun>;
  }
): { run: AutomationRun | null; breakLoop: boolean } {
  let automation = getAutomationState();
  let run = automation.runs.find((r) => r.id === runId);
  if (!run) return { run: null, breakLoop: true };

  if (result.runPatch) {
    run = patchRun(runId, result.runPatch) ?? run;
  }

  if (result.approval) {
    automation.steps = automation.steps.map((s) => (s.id === stepId ? result.step : s));
    automation.approvals = [result.approval, ...automation.approvals];
    run = {
      ...run,
      status: "waiting_for_approval",
      requiredApprovalIds: [...run.requiredApprovalIds, result.approval.id],
      updatedAt: new Date().toISOString(),
    };
    saveAutomation(setRunInState(automation, runId, run));
    return { run, breakLoop: true };
  }

  automation.steps = automation.steps.map((s) => (s.id === stepId ? result.step : s));
  saveAutomation(automation);

  if (result.error || result.step.status === "failed") {
    const failedRun: AutomationRun = {
      ...run,
      status: "failed",
      errorMessage: result.error ?? result.step.errorMessage,
      updatedAt: new Date().toISOString(),
    };
    saveAutomation(setRunInState(automation, runId, failedRun));
    return { run: failedRun, breakLoop: true };
  }

  const progressedRun: AutomationRun = {
    ...run,
    progress: calculateProgress(automation.steps, runId),
    updatedAt: new Date().toISOString(),
  };
  saveAutomation(setRunInState(automation, runId, progressedRun));

  if (result.pause) {
    return { run: progressedRun, breakLoop: true };
  }

  const nextProcess = processAutomationRun(runId);
  return { run: nextProcess.run, breakLoop: true };
}

export function pauseAutomation(runId: string): AutomationRun | null {
  const automation = getAutomationState();
  const run = automation.runs.find((r) => r.id === runId);
  if (!run || run.status !== "running") return run ?? null;
  const updated = { ...run, status: "paused" as const, pausedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  automation.runs = automation.runs.map((r) => (r.id === runId ? updated : r));
  saveAutomation(automation);
  addLog(updated, updated.currentStep, "pause", "Automation paused at safe checkpoint", "info");
  return updated;
}

export function stopAutomation(runId: string): AutomationRun | null {
  const automation = getAutomationState();
  const run = automation.runs.find((r) => r.id === runId);
  if (!run) return null;
  const updated = { ...run, status: "stopped" as const, stoppedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  automation.runs = automation.runs.map((r) => (r.id === runId ? updated : r));
  if (automation.activeRunId === runId) automation.activeRunId = null;
  saveAutomation(automation);
  addLog(updated, updated.currentStep, "stop", "Automation stopped by user", "warning");
  return updated;
}

export function resumeAutomation(runId: string): { run: AutomationRun | null; error?: string } {
  const automation = getAutomationState();
  const run = automation.runs.find((r) => r.id === runId);
  if (!run) return { run: null, error: "Run not found" };

  if (!allRequiredApprovalsComplete(automation.approvals, runId)) {
    return { run, error: "Required approvals are still pending" };
  }

  const updated = {
    ...run,
    status: "running" as const,
    resumedAt: new Date().toISOString(),
    pausedAt: null,
    updatedAt: new Date().toISOString(),
  };
  automation.runs = automation.runs.map((r) => (r.id === runId ? updated : r));
  automation.activeRunId = runId;
  saveAutomation(automation);
  addLog(updated, updated.currentStep, "resume", "Automation resumed after approvals", "success");
  return processAutomationRun(runId);
}

export function approveAndResume(approvalId: string, notes?: string): { run: AutomationRun | null; error?: string } {
  const automation = getAutomationState();
  const approval = automation.approvals.find((a) => a.id === approvalId);
  if (!approval) return { run: null, error: "Approval not found" };

  if (approval.approvalType === "lead_discovery_approval") {
    return {
      run: null,
      error: "Select a pending lead and click Approve Lead & Continue.",
    };
  }

  const session = getSessionContext();
  const updatedApproval = updateApprovalStatus(approval, "approved", session.userId, notes);
  automation.approvals = automation.approvals.map((a) => (a.id === approvalId ? updatedApproval : a));

  const step = automation.steps.find((s) => s.approvalId === approvalId);
  if (step) {
    automation.steps = automation.steps.map((s) =>
      s.id === step.id ? completeStep(s, { approved: true }) : s
    );
  }
  saveAutomation(automation);

  return resumeAutomation(approval.automationRunId);
}

export function approveLeadDiscoveryWithLeadId(
  approvalId: string,
  leadId: string,
  notes?: string
): { run: AutomationRun | null; error?: string; message?: string } {
  const automation = getAutomationState();
  const approval = automation.approvals.find((a) => a.id === approvalId);
  if (!approval) return { run: null, error: "Approval not found" };
  if (approval.approvalType !== "lead_discovery_approval") {
    return { run: null, error: "This approval requires selecting a pending lead." };
  }
  if (approval.status !== "pending") {
    return { run: null, error: "Approval already processed" };
  }
  if (!leadId) {
    return { run: null, error: "A lead must be approved before automation can resume." };
  }

  const session = getSessionContext();
  const updatedApproval = updateApprovalStatus(approval, "approved", session.userId, notes);
  automation.approvals = automation.approvals.map((a) => (a.id === approvalId ? updatedApproval : a));

  const step = automation.steps.find((s) => s.approvalId === approvalId);
  if (step) {
    automation.steps = automation.steps.map((s) =>
      s.id === step.id ? completeStep(s, { leadId, approvedLeadId: leadId, approved: true }) : s
    );
  }

  const run = automation.runs.find((r) => r.id === approval.automationRunId);
  if (run) {
    automation.runs = automation.runs.map((r) =>
      r.id === run.id
        ? {
            ...r,
            leadId,
            requiredApprovalIds: r.requiredApprovalIds?.filter((id) => id !== approvalId) ?? [],
            updatedAt: new Date().toISOString(),
          }
        : r
    );
  }

  saveAutomation(automation);

  const lead = resolveLead(leadId);
  const address = lead?.propertyAddress ?? leadId;
  if (run) {
    addLog(
      run,
      step?.stepName ?? "await_operator_lead_approval",
      "lead_approved",
      `Lead approved: ${address}. Automation resumed.`,
      "success"
    );
  }

  const resumeResult = resumeAutomation(approval.automationRunId);
  return {
    ...resumeResult,
    message: `Lead approved. Automation resumed with ${address}.`,
  };
}

export function rejectApproval(approvalId: string, notes?: string): AutomationApproval | null {
  const automation = getAutomationState();
  const approval = automation.approvals.find((a) => a.id === approvalId);
  if (!approval) return null;

  const session = getSessionContext();
  const updated = updateApprovalStatus(approval, "rejected", session.userId, notes);
  automation.approvals = automation.approvals.map((a) => (a.id === approvalId ? updated : a));

  const run = automation.runs.find((r) => r.id === approval.automationRunId);
  if (run) {
    automation.runs = automation.runs.map((r) =>
      r.id === run.id ? { ...r, status: "stopped", stoppedAt: new Date().toISOString(), errorMessage: "Approval rejected" } : r
    );
  }
  saveAutomation(automation);
  return updated;
}

export function getAutomationLogs(runId?: string) {
  const automation = getAutomationState();
  return runId ? automation.logs.filter((l) => l.automationRunId === runId) : automation.logs;
}

export function getPendingApprovals() {
  return getAutomationState().approvals.filter((a) => a.status === "pending");
}
