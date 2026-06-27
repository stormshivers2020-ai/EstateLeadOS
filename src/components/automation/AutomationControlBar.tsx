"use client";

import type { AutomationRun } from "@/lib/automation";
import { useAutomation } from "./AutomationContext";
import { stageLabel } from "@/lib/automation/automationQueue";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

export function AutomationControlBar({ run }: { run: AutomationRun }) {
  const { pause, stop, resume } = useAutomation();

  return (
    <div className="nova-panel rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--nova-text-muted)]">Status</span>
        <span className="font-medium capitalize text-[var(--nova-text-primary)]">{run.status.replace(/_/g, " ")}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--nova-text-muted)]">Stage</span>
        <span className="text-[var(--nova-text-secondary)]">{stageLabel(run.currentStage)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--nova-text-muted)]">Step</span>
        <span className="text-[var(--nova-text-secondary)]">{run.currentStep.replace(/_/g, " ")}</span>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-[var(--nova-text-muted)]">Progress</span>
          <span className="text-[var(--nova-gold-soft)]">{run.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--nova-panel-soft)]">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--nova-gold)] to-[#c4923f] transition-all duration-500" style={{ width: `${run.progress}%` }} />
        </div>
      </div>
      {run.errorMessage && (
        <p className="rounded-lg border border-[rgba(255,94,94,0.3)] bg-[rgba(255,94,94,0.08)] px-3 py-2 text-xs text-[var(--nova-red)]">{run.errorMessage}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {run.status === "running" && (
          <button type="button" onClick={pause} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs hover:border-[var(--nova-gold)]">
            <Pause className="h-3 w-3" /> Pause
          </button>
        )}
        {(run.status === "paused" || run.status === "waiting_for_approval") && (
          <button type="button" onClick={() => resume()} className="nova-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Play className="h-3 w-3" /> Resume
          </button>
        )}
        {run.status === "failed" && (
          <button type="button" onClick={() => resume()} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        )}
        {!["completed", "stopped", "cancelled"].includes(run.status) && (
          <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(255,94,94,0.3)] px-3 py-1.5 text-xs text-[var(--nova-red)]">
            <Square className="h-3 w-3" /> Stop
          </button>
        )}
      </div>
    </div>
  );
}
