"use client";

import Link from "next/link";
import { MASTER_PROCESS_STEPS, PROCESS_STATUS_COLORS, START_HERE_STEP } from "@/lib/constants/process-steps";
import type { ProcessStepStatus, ProcessStepStatusRecord } from "@/lib/types/analytics";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, Flag, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface ProcessStepMapProps {
  steps?: ProcessStepStatusRecord[];
  aggregateCounts?: Record<number, number>;
  currentStep?: number;
  nextStep?: number;
  compact?: boolean;
  leadId?: string;
}

function statusLabel(s: ProcessStepStatus): string {
  return s.replace(/_/g, " ");
}

export function ProcessStepMap({
  steps,
  aggregateCounts,
  currentStep,
  nextStep,
  compact,
  leadId,
}: ProcessStepMapProps) {
  const displaySteps = steps?.length
    ? steps.sort((a, b) => a.stepNumber - b.stepNumber)
    : MASTER_PROCESS_STEPS.map((s) => ({
        id: `global-${s.number}`,
        organizationId: "",
        leadId: leadId ?? "",
        stepNumber: s.number,
        stepName: s.name,
        status: "not_started" as ProcessStepStatus,
        blockerCount: aggregateCounts?.[s.number] ?? 0,
        nextAction: s.actionLabel,
        relatedModule: s.module,
        relatedFinancialImpact: null,
        completedAt: null,
        createdAt: "",
        updatedAt: "",
      }));

  const activeStep = currentStep ?? nextStep ?? START_HERE_STEP;

  return (
    <Card className="premium-panel nova-glow-gold">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-[var(--nova-gold)]" />
          EstateLeadOS Master Process
        </CardTitle>
        <p className="text-xs text-slate-400">
          Order of operations — Start Here marks the first required step; Next Step marks your immediate action.
        </p>
      </CardHeader>
      <CardContent>
        <div className={cn("space-y-2", compact && "max-h-80 overflow-y-auto pr-1")}>
          {displaySteps.map((step) => {
            const master = MASTER_PROCESS_STEPS.find((m) => m.number === step.stepNumber);
            const isStart = step.stepNumber === START_HERE_STEP;
            const isNext = step.stepNumber === activeStep;
            const count = aggregateCounts?.[step.stepNumber];

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border px-3 py-2.5 transition-colors",
                  isNext ? "border-[var(--nova-gold)] bg-[var(--nova-gold-muted)]/40" : "border-slate-700/50 bg-black/20",
                  step.status === "complete" && "opacity-80",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">Step {step.stepNumber}</span>
                      {isStart && (
                        <Badge variant="success" className="gap-1">
                          <Flag className="h-3 w-3" /> Start Here
                        </Badge>
                      )}
                      {isNext && !isStart && (
                        <Badge variant="warning" className="gap-1">
                          <ArrowRight className="h-3 w-3" /> Next Step
                        </Badge>
                      )}
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] uppercase", PROCESS_STATUS_COLORS[step.status])}>
                        {statusLabel(step.status)}
                      </span>
                      {count !== undefined && count > 0 && (
                        <span className="text-[10px] text-amber-400">{count} active</span>
                      )}
                      {step.blockerCount > 0 && (
                        <span className="text-[10px] text-red-400">{step.blockerCount} blocker(s)</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-100">{step.stepName}</p>
                    {!compact && (
                      <>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {step.relatedModule} · Action: {step.nextAction ?? master?.actionLabel}
                        </p>
                        {step.relatedFinancialImpact != null && step.relatedFinancialImpact > 0 && (
                          <p className="mt-0.5 text-xs text-[var(--nova-gold-soft)]">
                            Est. value impact: {formatCurrency(step.relatedFinancialImpact)} (estimated)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {master?.href && (
                    <Link
                      href={leadId ? `/leads/${leadId}` : master.href}
                      className="shrink-0 text-xs text-sky-400 hover:text-[var(--nova-gold-soft)]"
                    >
                      Open →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
