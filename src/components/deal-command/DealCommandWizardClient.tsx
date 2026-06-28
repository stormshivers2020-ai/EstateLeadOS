"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirstPacketGuide } from "@/components/deal-command/FirstPacketGuide";
import { GuidedOperationsWizard } from "@/components/deal-command/GuidedOperationsWizard";
import { useLeads } from "@/hooks/useLeads";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { getSessionContext } from "@/lib/config/session";
import { getLeadFinancials } from "@/lib/services/analytics";
import { getAssignments } from "@/lib/services/assignments";
import { getLocalState } from "@/lib/local/localStateStore";
import { inferLeadCurrentStep, getNextProcessStep } from "@/lib/services/analytics/process-step";
import { DealCommandStepper } from "@/components/deal-command/DealCommandStepper";
import { Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type GuideMode = "first-packet" | "full";

export function DealCommandWizardClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads, loading: leadsLoading } = useLeads();
  const [leadId, setLeadId] = useState(params.get("leadId") ?? "");
  const [mode, setMode] = useState<GuideMode>(
    params.get("mode") === "full" ? "full" : "first-packet"
  );
  const leadPickerRef = useRef<HTMLSelectElement>(null);
  const leadPickerWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromUrl = params.get("leadId");
    if (fromUrl) setLeadId(fromUrl);
    else if (!leadId && leads[0]?.id) setLeadId(leads[0].id);
  }, [params, leads, leadId]);

  useEffect(() => {
    setMode(params.get("mode") === "full" ? "full" : "first-packet");
  }, [params]);

  const onLeadChange = useCallback(
    (id: string) => {
      setLeadId(id);
      const next = new URLSearchParams(params.toString());
      if (id) next.set("leadId", id);
      else next.delete("leadId");
      router.replace(`/deal-command?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const switchMode = useCallback(
    (next: GuideMode) => {
      setMode(next);
      const nextParams = new URLSearchParams(params.toString());
      if (next === "full") {
        nextParams.set("mode", "full");
        if (!nextParams.has("op")) nextParams.set("op", "0");
        nextParams.delete("p");
      } else {
        nextParams.delete("mode");
        if (!nextParams.has("p")) nextParams.set("p", "0");
        nextParams.delete("op");
      }
      router.replace(`/deal-command?${nextParams.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const focusLeadPicker = useCallback(() => {
    leadPickerWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    leadPickerRef.current?.focus();
  }, []);

  if (leadsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-lg text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  const pageIndex = parseInt(params.get("p") ?? "0", 10);
  const showLeadPicker = mode === "first-packet" && pageIndex >= 5;

  return (
    <div className="pb-8">
      {/* Mode toggle — minimal pills */}
      <div className="mx-auto mb-6 flex max-w-xl justify-center">
        <div className="inline-flex rounded-2xl border border-slate-700/60 bg-slate-900/60 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => switchMode("first-packet")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              mode === "first-packet"
                ? "bg-[var(--nova-gold)] text-black shadow"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            My first packet
          </button>
          <button
            type="button"
            onClick={() => switchMode("full")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              mode === "full"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Full system (advanced)
          </button>
        </div>
      </div>

      {/* House picker — only when needed, friendly label */}
      {showLeadPicker && (
        <div
          ref={leadPickerWrapRef}
          className="mx-auto mb-6 max-w-xl rounded-2xl border border-violet-500/30 bg-violet-950/20 px-5 py-4 backdrop-blur-sm"
        >
          <label className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
              <Home className="h-5 w-5 text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-violet-200">Pick your house</span>
              <select
                ref={leadPickerRef}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-base text-slate-100"
                value={leadId}
                onChange={(e) => onLeadChange(e.target.value)}
              >
                <option value="">— Choose an address —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.propertyAddress ?? l.ownerName ?? l.id}
                  </option>
                ))}
              </select>
            </div>
          </label>
          {leads.length === 0 && (
            <p className="mt-3 text-sm text-amber-200">
              No houses yet. Go back a few pages and run Government Pipeline first.
            </p>
          )}
        </div>
      )}

      {mode === "first-packet" ? (
        <FirstPacketGuide leadId={leadId || undefined} onNeedHouse={focusLeadPicker} />
      ) : (
        <div className="space-y-6">
          <div className="mx-auto max-w-2xl">
            <label className="block rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <span className="text-xs text-slate-500">House (for steps 4–26)</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={leadId}
                onChange={(e) => onLeadChange(e.target.value)}
              >
                <option value="">No house selected</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.propertyAddress ?? l.ownerName ?? l.id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <GuidedOperationsWizard leadId={leadId || undefined} />
          <p className="text-center text-xs text-slate-600">
            <button
              type="button"
              onClick={() => switchMode("first-packet")}
              className="text-sky-400 hover:underline"
            >
              ← Back to simple first-packet guide
            </button>
          </p>
        </div>
      )}

      <p className="mx-auto mt-10 max-w-xl text-center text-[10px] text-slate-600">
        {APP_NAME} · Powered by {POWERED_BY}
      </p>
    </div>
  );
}

export function DealCommandStepperSection({
  currentStep,
  sectionSteps,
  leadId,
  compact = true,
}: {
  currentStep?: number;
  sectionSteps?: number[];
  leadId?: string;
  compact?: boolean;
}) {
  const session = getSessionContext();
  const financialData = leadId ? getLeadFinancials(leadId) : null;
  const state = getLocalState();
  const assignments = getAssignments();

  let steps = financialData?.processSteps;
  let step = currentStep ?? financialData?.currentStep;

  if (!leadId) {
    const inferredSteps = state.leads.map((lead) => {
      const ctx = {
        lead,
        assignment: assignments.find((a) => a.leadId === lead.id),
        packets: state.programPackets.filter((p) => p.leadId === lead.id),
        archives: state.leadArchives.filter((a) => a.leadId === lead.id),
        attorneyReview: state.attorneyReviews.find((r) => r.leadId === lead.id),
        distributionPacket: state.distributionPackets.find((p) => p.leadId === lead.id),
        emailDistribution: state.emailDistributions.find((e) => e.leadId === lead.id),
        packetPrintCount: state.packetPrintLogs.filter((l) => l.leadId === lead.id).length,
      };
      return inferLeadCurrentStep(ctx);
    });
    step = step ?? (state.leads.length === 0 ? 1 : Math.min(...inferredSteps));
  }

  return (
    <DealCommandStepper
      steps={steps}
      currentStep={step}
      nextStep={step ? getNextProcessStep(step) : undefined}
      leadId={leadId}
      sectionSteps={sectionSteps}
      compact={compact}
      organizationId={session.organizationId}
    />
  );
}
