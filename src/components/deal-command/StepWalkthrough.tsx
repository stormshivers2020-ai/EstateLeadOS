"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getWalkthroughForStep,
  getMasterStep,
  getPhaseForStep,
  walkthroughStepHref,
  STEP_WALKTHROUGH,
} from "@/lib/constants/step-walkthrough";
import { START_HERE_STEP, FINAL_OUTCOME_STEP } from "@/lib/constants/process-steps";
import { getNextProcessStep } from "@/lib/services/analytics/process-step";
import type { ProcessStepStatusRecord } from "@/lib/types/analytics";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  List,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const WALKTHROUGH_STORAGE_KEY = "estateleados-walkthrough-step";

interface StepWalkthroughProps {
  leadId?: string;
  currentStep?: number;
  stepRecords?: ProcessStepStatusRecord[];
  onStepChange?: (step: number) => void;
}

export function StepWalkthrough({ leadId, currentStep, stepRecords, onStepChange }: StepWalkthroughProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStep = searchParams.get("step");
  const [viewStep, setViewStep] = useState(() => {
    const n = urlStep ? parseInt(urlStep, 10) : currentStep ?? START_HERE_STEP;
    return Number.isFinite(n) && n >= 1 && n <= 26 ? n : START_HERE_STEP;
  });
  const [showAllSteps, setShowAllSteps] = useState(false);

  const inferredCurrent = currentStep ?? START_HERE_STEP;
  const content = getWalkthroughForStep(viewStep);
  const master = getMasterStep(viewStep);
  const stepRecord = stepRecords?.find((s) => s.stepNumber === viewStep);
  const actionHref = walkthroughStepHref(viewStep, leadId);
  const progressPct = Math.round((viewStep / FINAL_OUTCOME_STEP) * 100);
  const requiresLead = content?.requiresLead && !leadId;

  useEffect(() => {
    if (urlStep) {
      const n = parseInt(urlStep, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 26) setViewStep(n);
    }
  }, [urlStep]);

  const goToStep = useCallback(
    (step: number) => {
      const clamped = Math.max(START_HERE_STEP, Math.min(FINAL_OUTCOME_STEP, step));
      setViewStep(clamped);
      onStepChange?.(clamped);
      if (typeof window !== "undefined") {
        localStorage.setItem(WALKTHROUGH_STORAGE_KEY, String(clamped));
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(clamped));
      if (leadId) params.set("leadId", leadId);
      router.replace(`/deal-command?${params.toString()}`, { scroll: false });
    },
    [leadId, onStepChange, router, searchParams]
  );

  const syncToCurrent = useCallback(() => {
    goToStep(inferredCurrent);
  }, [goToStep, inferredCurrent]);

  useEffect(() => {
    if (!urlStep && !currentStep && typeof window !== "undefined") {
      const stored = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 1 && n <= 26) setViewStep(n);
      }
    }
  }, [urlStep, currentStep]);

  const statusLabel = useMemo(() => {
    if (!stepRecord) return null;
    if (stepRecord.status === "complete") return "Complete";
    if (stepRecord.status === "blocked") return "Blocked";
    if (viewStep === inferredCurrent) return "Your current step";
    if (viewStep < inferredCurrent) return "Done — you can review";
    return "Upcoming";
  }, [stepRecord, viewStep, inferredCurrent]);

  if (!content || !master) return null;

  return (
    <div className="space-y-4">
      <div className="nova-panel rounded-xl border border-[var(--nova-gold-muted)]/50 p-5">
        <p className="text-[10px] uppercase tracking-widest text-[var(--nova-gold-soft)]">
          {APP_NAME} · Powered by {POWERED_BY}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">Walk Me Through Each Step</h2>
        <p className="mt-2 text-sm text-slate-400">
          EstateLeadOS guides you one step at a time from county selection through final archive. Complete the action,
          then move to the next step.
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>
              Step {viewStep} of {FINAL_OUTCOME_STEP} · {getPhaseForStep(viewStep)}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-[var(--nova-gold)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <Card className="border-[var(--nova-gold-muted)]/60 bg-gradient-to-br from-black/40 to-[var(--nova-gold-muted)]/10">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {viewStep === START_HERE_STEP && <Flag className="h-4 w-4 text-emerald-400" />}
              Step {viewStep}: {content.headline}
            </CardTitle>
            {statusLabel && (
              <Badge variant={viewStep === inferredCurrent ? "warning" : stepRecord?.status === "complete" ? "success" : "default"}>
                {statusLabel}
              </Badge>
            )}
            <Badge variant="info">{master.module}</Badge>
          </div>
          <p className="text-sm text-slate-400">{master.name}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {requiresLead && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Select a lead above to complete Steps 4–26 for a specific property.
            </div>
          )}

          {content.doNotSkip && (
            <p className="rounded border border-sky-800/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-200">
              {content.doNotSkip}
            </p>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">What to do</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
              {content.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Done when</p>
            <ul className="space-y-1.5">
              {content.completionCriteria.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/80" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {stepRecord?.blockerReason && (
            <p className="rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              Blocker: {stepRecord.blockerReason}
            </p>
          )}

          {content.tips?.map((t) => (
            <p key={t} className="text-xs text-slate-500">
              Tip: {t}
            </p>
          ))}

          <div className="flex flex-wrap gap-2 border-t border-slate-700/50 pt-4">
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--nova-gold)] px-4 py-2.5 text-sm font-medium text-black hover:opacity-90"
            >
              {master.actionLabel} <ExternalLink className="h-4 w-4" />
            </Link>
            {viewStep === inferredCurrent && (
              <button
                type="button"
                onClick={() => goToStep(getNextProcessStep(viewStep))}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm text-emerald-200"
              >
                I&apos;m done — next step <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {viewStep !== inferredCurrent && (
              <button
                type="button"
                onClick={syncToCurrent}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-400"
              >
                Jump to my current step ({inferredCurrent})
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={viewStep <= START_HERE_STEP}
              onClick={() => goToStep(viewStep - 1)}
              className="inline-flex items-center gap-1 text-sm text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous step
            </button>
            <button
              type="button"
              onClick={() => setShowAllSteps((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-sky-400"
            >
              <List className="h-3 w-3" /> {showAllSteps ? "Hide" : "Show"} all steps
            </button>
            <button
              type="button"
              disabled={viewStep >= FINAL_OUTCOME_STEP}
              onClick={() => goToStep(viewStep + 1)}
              className="inline-flex items-center gap-1 text-sm text-sky-400 disabled:opacity-40"
            >
              Next step <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {showAllSteps && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All 26 steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1 sm:grid-cols-2">
              {STEP_WALKTHROUGH.map((s) => (
                <li key={s.stepNumber}>
                  <button
                    type="button"
                    onClick={() => goToStep(s.stepNumber)}
                    className={cn(
                      "w-full rounded border px-2 py-1.5 text-left text-xs transition-colors",
                      s.stepNumber === viewStep
                        ? "border-[var(--nova-gold)] bg-[var(--nova-gold-muted)]/30 text-slate-100"
                        : s.stepNumber === inferredCurrent
                          ? "border-sky-700/50 text-sky-300"
                          : "border-slate-700/50 text-slate-500 hover:border-slate-600"
                    )}
                  >
                    <span className="font-mono text-slate-600">{s.stepNumber}.</span> {s.headline}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
