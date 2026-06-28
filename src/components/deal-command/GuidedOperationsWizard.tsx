"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GUIDED_OPERATIONS,
  GUIDED_OPERATION_COUNT,
  getGuidedOperation,
  resolveGuidedHref,
  getMacroStepName,
  getMacroPhase,
} from "@/lib/constants/guided-operations";
import { FINAL_OUTCOME_STEP } from "@/lib/constants/process-steps";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { cn } from "@/lib/utils/cn";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MousePointerClick,
  Keyboard,
  ListChecks,
  Eye,
  Navigation,
  CheckSquare,
  Clock,
  AlertCircle,
} from "lucide-react";

const GUIDED_STORAGE_KEY = "estateleados-guided-op";

const KIND_META: Record<
  string,
  { label: string; icon: typeof MousePointerClick; color: string }
> = {
  navigate: { label: "Go to", icon: Navigation, color: "text-sky-400" },
  click: { label: "Click", icon: MousePointerClick, color: "text-emerald-400" },
  type: { label: "Type", icon: Keyboard, color: "text-amber-400" },
  select: { label: "Select", icon: ListChecks, color: "text-violet-400" },
  checkbox: { label: "Check", icon: CheckSquare, color: "text-pink-400" },
  review: { label: "Review", icon: Eye, color: "text-slate-300" },
  wait: { label: "Wait for", icon: Clock, color: "text-orange-400" },
};

interface GuidedOperationsWizardProps {
  leadId?: string;
}

export function GuidedOperationsWizard({ leadId }: GuidedOperationsWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOp = searchParams.get("op");

  const [opIndex, setOpIndex] = useState(() => {
    const n = urlOp ? parseInt(urlOp, 10) : 0;
    return Number.isFinite(n) && n >= 0 && n < GUIDED_OPERATION_COUNT ? n : 0;
  });

  const operation = getGuidedOperation(opIndex);
  const progressPct = Math.round(((opIndex + 1) / GUIDED_OPERATION_COUNT) * 100);
  const macroProgressPct = operation
    ? Math.round((operation.macroStep / FINAL_OUTCOME_STEP) * 100)
    : 0;
  const requiresLead = operation?.requiresLead && !leadId;
  const actionHref = resolveGuidedHref(operation?.href, leadId);
  const kindMeta = operation ? KIND_META[operation.kind] : null;
  const KindIcon = kindMeta?.icon ?? MousePointerClick;

  const goToOp = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(GUIDED_OPERATION_COUNT - 1, index));
      setOpIndex(clamped);
      if (typeof window !== "undefined") {
        localStorage.setItem(GUIDED_STORAGE_KEY, String(clamped));
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("op", String(clamped));
      if (leadId) params.set("leadId", leadId);
      router.replace(`/deal-command?${params.toString()}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [leadId, router, searchParams]
  );

  useEffect(() => {
    if (urlOp) {
      const n = parseInt(urlOp, 10);
      if (Number.isFinite(n) && n >= 0 && n < GUIDED_OPERATION_COUNT) setOpIndex(n);
    }
  }, [urlOp]);

  useEffect(() => {
    if (!urlOp && typeof window !== "undefined") {
      const stored = localStorage.getItem(GUIDED_STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= 0 && n < GUIDED_OPERATION_COUNT) setOpIndex(n);
      }
    }
  }, [urlOp]);

  if (!operation) return null;

  const isFirst = opIndex === 0;
  const isLast = opIndex === GUIDED_OPERATION_COUNT - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-0">
      {/* Progress header — minimal */}
      <div className="mb-6 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[var(--nova-gold-soft)]">
          {APP_NAME} · Powered by {POWERED_BY}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Operation {opIndex + 1} of {GUIDED_OPERATION_COUNT} · Master Step {operation.macroStep} of{" "}
          {FINAL_OUTCOME_STEP}
        </p>
        <div className="mx-auto mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-[var(--nova-gold)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-slate-600">
          {getMacroPhase(operation.macroStep)} · {macroProgressPct}% through full workflow
        </p>
      </div>

      {/* Single operation card — full focus */}
      <div className="nova-panel rounded-2xl border border-[var(--nova-gold-muted)]/60 p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              kindMeta?.color,
              "border-current/30 bg-current/10"
            )}
          >
            <KindIcon className="h-3 w-3" />
            {kindMeta?.label}
          </span>
          <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
            Step {operation.macroStep}: {getMacroStepName(operation.macroStep)}
          </span>
        </div>

        <p className="text-xs uppercase tracking-wider text-slate-500">{operation.screen}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl">
          {operation.title}
        </h1>

        {requiresLead && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Select a lead at the top of this page before continuing.
          </div>
        )}

        <p className="mt-5 text-base leading-relaxed text-slate-300">{operation.instruction}</p>

        {/* Exact UI targets */}
        <div className="mt-6 space-y-3">
          {operation.buttonLabel && (
            <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/25 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80">
                Button to click
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-emerald-200">
                {operation.buttonLabel}
              </p>
            </div>
          )}

          {(operation.fieldLabel || operation.typeExample || operation.selectOption) && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/25 px-4 py-3">
              {operation.fieldLabel && (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">
                    Field / dropdown
                  </p>
                  <p className="mt-1 font-mono text-base text-amber-200">{operation.fieldLabel}</p>
                </>
              )}
              {operation.typeExample && (
                <p className="mt-2 text-sm text-slate-300">
                  Type: <span className="font-mono font-semibold text-white">{operation.typeExample}</span>
                </p>
              )}
              {operation.selectOption && (
                <p className="mt-2 text-sm text-slate-300">
                  Choose: <span className="font-mono font-semibold text-white">{operation.selectOption}</span>
                </p>
              )}
            </div>
          )}

          {operation.lookFor && (
            <div className="rounded-xl border border-sky-800/40 bg-sky-950/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-500/80">
                Before you click next — confirm on screen
              </p>
              <p className="mt-1 text-sm text-sky-200">{operation.lookFor}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {actionHref && !requiresLead && (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-slate-100 ring-1 ring-slate-600 hover:bg-slate-700"
            >
              Open this screen <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={() => goToOp(opIndex + 1)}
              disabled={!!requiresLead}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--nova-gold)] px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40"
            >
              I did this — next <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {isLast && (
            <button
              type="button"
              onClick={() => goToOp(0)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Start over from operation 1
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-700/50 pt-4">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => goToOp(opIndex - 1)}
            className="inline-flex items-center gap-1 text-sm text-slate-400 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-[10px] text-slate-600">
            {opIndex + 1} / {GUIDED_OPERATION_COUNT}
          </span>
          <button
            type="button"
            disabled={isLast}
            onClick={() => goToOp(opIndex + 1)}
            className="inline-flex items-center gap-1 text-sm text-sky-400 disabled:opacity-30"
          >
            Skip ahead <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] text-slate-600">
        One operation per screen. Complete the action above, confirm what you see, then click I did this — next.
      </p>
    </div>
  );
}
