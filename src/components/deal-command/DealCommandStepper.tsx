"use client";

import Link from "next/link";
import {
  MASTER_PROCESS_STEPS,
  PROCESS_PHASE_LABELS,
  PROCESS_STATUS_COLORS,
  PROCESS_STATUS_LABELS,
  START_HERE_STEP,
  FIRST_ARCHIVE_STEP,
  FINAL_ARCHIVE_STEP,
  ATTORNEY_REVIEW_STEP_START,
  ATTORNEY_REVIEW_STEP_END,
  DEAL_COMMAND_DISCLAIMER,
} from "@/lib/constants/process-steps";
import type { ProcessStepStatusRecord } from "@/lib/types/analytics";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import {
  ArrowRight,
  Flag,
  Compass,
  FileStack,
  Scale,
  Archive,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Printer,
} from "lucide-react";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { buildGlobalProcessSteps, getNextProcessStep } from "@/lib/services/analytics/process-step";

export interface DealCommandStepperProps {
  steps?: ProcessStepStatusRecord[];
  aggregateCounts?: Record<number, number>;
  currentStep?: number;
  nextStep?: number;
  compact?: boolean;
  leadId?: string;
  /** Highlight steps relevant to the current page section */
  sectionSteps?: number[];
  showDisclaimer?: boolean;
  organizationId?: string;
}

import { guidedHrefForMacroStep } from "@/lib/constants/guided-operations";

function phaseIcon(phase: string) {
  switch (phase) {
    case "discover":
      return Compass;
    case "prove":
      return CheckCircle2;
    case "package":
      return FileStack;
    case "attorney":
      return Scale;
    case "distribute":
      return Send;
    case "close":
      return Archive;
    default:
      return Compass;
  }
}

function statusIcon(status: ProcessStepStatusRecord["status"]) {
  if (status === "ready_to_print") return Printer;
  if (status === "ready_to_upload") return Upload;
  if (status === "blocked") return AlertTriangle;
  return null;
}

export function DealCommandStepper({
  steps,
  aggregateCounts,
  currentStep,
  nextStep,
  compact,
  leadId,
  sectionSteps,
  showDisclaimer = true,
  organizationId = "",
}: DealCommandStepperProps) {
  const displaySteps = steps?.length
    ? [...steps].sort((a, b) => a.stepNumber - b.stepNumber)
    : buildGlobalProcessSteps(organizationId, aggregateCounts);

  const activeStep = currentStep ?? nextStep ?? START_HERE_STEP;
  const nextStepNumber = getNextProcessStep(activeStep);
  let lastPhase: string | null = null;

  return (
    <Card className="premium-panel nova-glow-gold overflow-hidden">
      <CardHeader className="border-b border-[var(--nova-gold-muted)]/30 bg-gradient-to-r from-black/40 to-[var(--nova-gold-muted)]/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--nova-gold-soft)]">
              {APP_NAME} · Powered by {POWERED_BY}
            </p>
            <CardTitle className="mt-1 flex items-center gap-2 text-base">
              <Compass className="h-4 w-4 text-[var(--nova-gold)]" />
              Deal Command Wizard
            </CardTitle>
            <p className="mt-1 text-xs text-slate-400">
              Step {START_HERE_STEP} is always first. Step {activeStep} is your current focus. Step {nextStepNumber} is next.
            </p>
          </div>
          <Link
            href={guidedHrefForMacroStep(activeStep, leadId)}
            className="shrink-0 rounded-lg border border-[var(--nova-gold-muted)] bg-[var(--nova-gold-muted)]/20 px-3 py-1.5 text-xs font-medium text-[var(--nova-gold-soft)] hover:bg-[var(--nova-gold-muted)]/40"
          >
            Step-by-Step Guide →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {showDisclaimer && (
          <p className="mb-4 rounded-lg border border-slate-700/50 bg-black/30 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            {DEAL_COMMAND_DISCLAIMER}
          </p>
        )}

        <div className={cn("space-y-2", compact && "max-h-[28rem] overflow-y-auto pr-1")}>
          {displaySteps.map((step) => {
            const master = MASTER_PROCESS_STEPS.find((m) => m.number === step.stepNumber);
            const isStart = step.stepNumber === START_HERE_STEP;
            const isCurrent = step.stepNumber === activeStep;
            const isNext = step.stepNumber === nextStepNumber && !isCurrent;
            const isSection = sectionSteps?.includes(step.stepNumber);
            const count = aggregateCounts?.[step.stepNumber];
            const StatusIcon = statusIcon(step.status);
            const showPhaseHeader = master && master.phase !== lastPhase;
            if (showPhaseHeader && master) lastPhase = master.phase;
            const PhaseIcon = master ? phaseIcon(master.phase) : Compass;

            return (
              <div key={step.id}>
                {showPhaseHeader && master && !compact && (
                  <div className="mb-2 mt-3 flex items-center gap-2 first:mt-0">
                    <PhaseIcon className="h-3.5 w-3.5 text-[var(--nova-gold)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {PROCESS_PHASE_LABELS[master.phase]}
                    </span>
                    {master.firstArchive && (
                      <Badge variant="info" className="text-[9px]">First Archive · Step {FIRST_ARCHIVE_STEP}</Badge>
                    )}
                    {master.finalArchive && step.stepNumber === FINAL_ARCHIVE_STEP && (
                      <Badge variant="warning" className="text-[9px]">Final Archive · Step {FINAL_ARCHIVE_STEP}</Badge>
                    )}
                    {step.stepNumber === ATTORNEY_REVIEW_STEP_START && (
                      <Badge variant="default" className="text-[9px]">
                        Attorney Review · Steps {ATTORNEY_REVIEW_STEP_START}–{ATTORNEY_REVIEW_STEP_END}
                      </Badge>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-lg border px-3 py-2.5 transition-colors",
                    isCurrent && "border-[var(--nova-gold)] bg-[var(--nova-gold-muted)]/40 shadow-[0_0_20px_rgba(214,168,79,0.08)]",
                    isNext && !isCurrent && "border-sky-700/50 bg-sky-950/20",
                    isSection && !isCurrent && "border-indigo-700/40",
                    !isCurrent && !isNext && !isSection && "border-slate-700/50 bg-black/20",
                    step.status === "complete" && "opacity-85",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-mono text-slate-500">Step {step.stepNumber}</span>
                        {isStart && (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <Flag className="h-3 w-3" /> First Step
                          </Badge>
                        )}
                        {isCurrent && !isStart && (
                          <Badge variant="warning" className="gap-1 text-[10px]">
                            <ArrowRight className="h-3 w-3" /> Current Step
                          </Badge>
                        )}
                        {isNext && (
                          <Badge variant="info" className="gap-1 text-[10px]">
                            Next Step
                          </Badge>
                        )}
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] uppercase",
                            PROCESS_STATUS_COLORS[step.status],
                          )}
                        >
                          {StatusIcon && <StatusIcon className="mr-0.5 inline h-3 w-3" />}
                          {PROCESS_STATUS_LABELS[step.status]}
                        </span>
                        {count !== undefined && count > 0 && (
                          <span className="text-[10px] text-amber-400">{count} active lead(s)</span>
                        )}
                        {step.blockerCount > 0 && (
                          <span className="text-[10px] text-red-400">{step.blockerCount} blocker(s)</span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-medium text-slate-100">{step.stepName}</p>

                      {!compact && (
                        <div className="mt-1.5 space-y-1 text-xs text-slate-500">
                          <p>
                            <span className="text-slate-600">Module:</span> {step.relatedModule ?? master?.module}
                            {" · "}
                            <span className="text-slate-600">Action:</span> {step.nextAction ?? master?.actionLabel}
                          </p>
                          {(step.requiredDocumentsCount > 0 || step.completedDocumentsCount > 0) && (
                            <p>
                              Documents: {step.completedDocumentsCount}/{step.requiredDocumentsCount} complete
                            </p>
                          )}
                          {step.manualApprovalRequired && step.approvalStatus && (
                            <p className="text-amber-400/90">
                              Manual approval: {step.approvalStatus.replace(/_/g, " ")} — not legal approval
                            </p>
                          )}
                          {step.attorneyReviewRequired && step.attorneyReviewStatus && (
                            <p className="text-purple-300/90">
                              Attorney review: {step.attorneyReviewStatus.replace(/_/g, " ")}
                            </p>
                          )}
                          {step.blockerReason && (
                            <p className="rounded border border-red-900/40 bg-red-950/20 px-2 py-1 text-red-300">
                              Blocked: {step.blockerReason}
                            </p>
                          )}
                        </div>
                      )}

                      {compact && step.blockerReason && (
                        <p className="mt-1 text-[10px] text-red-300">{step.blockerReason}</p>
                      )}
                    </div>

                    <Link
                      href={guidedHrefForMacroStep(step.stepNumber, leadId)}
                      className={cn(
                        "shrink-0 rounded border px-2 py-1 text-xs transition-colors",
                        isCurrent || isNext
                          ? "border-[var(--nova-gold-muted)] bg-[var(--nova-gold-muted)]/30 text-[var(--nova-gold-soft)]"
                          : "border-slate-600 text-sky-400 hover:text-[var(--nova-gold-soft)]",
                      )}
                    >
                      {step.nextAction ?? master?.actionLabel ?? "Open"} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** @deprecated Use DealCommandStepper */
export const ProcessStepMap = DealCommandStepper;
