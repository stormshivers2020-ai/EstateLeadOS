import type {
  AutomationRun,
  AutomationStep,
  AutomationType,
  AutomationStage,
  AutomationState,
} from "./automationTypes";
import { TYPE_STAGE_MAP, STAGE_STEPS } from "./automationTypes";

let stepOrder = 0;

export function buildStepsForRun(runId: string, automationType: AutomationType): AutomationStep[] {
  const stages = TYPE_STAGE_MAP[automationType] ?? [];
  const steps: AutomationStep[] = [];
  stepOrder = 0;

  for (const stage of stages) {
    const stepNames = STAGE_STEPS[stage] ?? [];
    for (const stepName of stepNames) {
      stepOrder += 1;
      const now = new Date().toISOString();
      steps.push({
        id: `step-${runId}-${stepOrder}`,
        automationRunId: runId,
        stepName,
        stepOrder,
        stage,
        status: "pending",
        inputData: null,
        outputData: null,
        requiresApproval: false,
        approvalId: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  return steps;
}

export function getNextPendingStep(steps: AutomationStep[], runId: string): AutomationStep | null {
  return steps
    .filter((s) => s.automationRunId === runId && s.status === "pending")
    .sort((a, b) => a.stepOrder - b.stepOrder)[0] ?? null;
}

export function calculateProgress(steps: AutomationStep[], runId: string): number {
  const runSteps = steps.filter((s) => s.automationRunId === runId);
  if (runSteps.length === 0) return 0;
  const completed = runSteps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  return Math.round((completed / runSteps.length) * 100);
}

export function getActiveRun(state: AutomationState): AutomationRun | null {
  if (!state.activeRunId) return null;
  return state.runs.find((r) => r.id === state.activeRunId) ?? null;
}

export function getRunById(state: AutomationState, runId: string): AutomationRun | null {
  return state.runs.find((r) => r.id === runId) ?? null;
}

export function stageLabel(stage: AutomationStage): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
