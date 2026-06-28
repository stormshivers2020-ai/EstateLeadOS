"use client";

import { FIRST_LEAD_STEP_META } from "@/lib/constants/first-lead-steps";
import type { WalkthroughStepId } from "@/lib/types/walkthrough";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Circle, Lock } from "lucide-react";

interface WalkthroughStepTrackerProps {
  currentStep: WalkthroughStepId;
  completedSteps: WalkthroughStepId[];
  onSelectStep?: (step: WalkthroughStepId) => void;
}

export function WalkthroughStepTracker({
  currentStep,
  completedSteps,
  onSelectStep,
}: WalkthroughStepTrackerProps) {
  const visible = FIRST_LEAD_STEP_META.filter((s) => s.id !== "complete");

  return (
    <nav className="space-y-1" aria-label="Walkthrough steps">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        First Lead Walkthrough
      </p>
      {visible.map((step) => {
        const done = completedSteps.includes(step.id);
        const active = step.id === currentStep;
        const locked = !done && !active;

        return (
          <button
            key={step.id}
            type="button"
            disabled={locked || !onSelectStep}
            onClick={() => onSelectStep?.(step.id)}
            className={cn(
              "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
              active && "bg-[var(--nova-gold-muted)]/30 text-slate-100",
              done && !active && "text-emerald-400/90 hover:bg-slate-800/50",
              locked && "cursor-not-allowed text-slate-600 opacity-60"
            )}
          >
            {done ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : active ? (
              <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-[var(--nova-gold)] text-[var(--nova-gold)]" />
            ) : (
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
            )}
            <span>
              <span className="font-mono text-[10px] text-slate-500">{step.stepNumber}.</span>{" "}
              <span className="font-medium">{step.title}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
