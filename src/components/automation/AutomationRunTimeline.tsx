"use client";

import { getAutomationState } from "@/lib/automation";
import { stageLabel } from "@/lib/automation/automationQueue";
import { CheckCircle, Circle, AlertCircle, Clock } from "lucide-react";

export function AutomationRunTimeline({ runId }: { runId: string }) {
  const state = getAutomationState();
  const steps = state.steps.filter((s) => s.automationRunId === runId).sort((a, b) => a.stepOrder - b.stepOrder);

  if (steps.length === 0) return null;

  return (
    <div>
      <p className="nova-label mb-3">Timeline</p>
      <ul className="space-y-2">
        {steps.map((step) => {
          const Icon =
            step.status === "completed" ? CheckCircle :
            step.status === "failed" ? AlertCircle :
            step.status === "running" ? Clock :
            step.status === "waiting_approval" ? AlertCircle : Circle;
          const color =
            step.status === "completed" ? "text-[var(--nova-green)]" :
            step.status === "failed" ? "text-[var(--nova-red)]" :
            step.status === "running" ? "text-[var(--nova-gold)]" :
            step.status === "waiting_approval" ? "text-[var(--nova-orange)]" : "text-[var(--nova-text-muted)]";

          return (
            <li key={step.id} className="flex items-start gap-2 text-xs">
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
              <div>
                <p className="text-[var(--nova-text-secondary)]">{step.stepName.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-[var(--nova-text-muted)]">{stageLabel(step.stage)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
