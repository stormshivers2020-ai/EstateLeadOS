"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WalkthroughStepTracker } from "@/components/walkthrough/WalkthroughStepTracker";
import { WalkthroughStepForm } from "@/components/walkthrough/WalkthroughStepForm";
import { WalkthroughEvidencePanel } from "@/components/walkthrough/WalkthroughEvidencePanel";
import { WalkthroughComplete } from "@/components/walkthrough/WalkthroughComplete";
import { canContinue, getPreviousStep } from "@/lib/services/walkthrough/engine";
import type { LeadWalkthroughSession, StepValidationResult, WalkthroughStepData, WalkthroughStepId } from "@/lib/types/walkthrough";
import { APP_NAME } from "@/lib/constants/brand";
import { AlertCircle, ChevronRight, HelpCircle, Loader2, Lock, Save } from "lucide-react";
import Link from "next/link";

export function FirstLeadWalkthroughClient() {
  const router = useRouter();
  const [session, setSession] = useState<LeadWalkthroughSession | null>(null);
  const [stepData, setStepData] = useState<WalkthroughStepData>({});
  const [validation, setValidation] = useState<StepValidationResult>({ valid: false, missing: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/walkthrough/first-lead");
    const json = await res.json();
    let s = json.active as LeadWalkthroughSession | null;
    if (!s) {
      const created = await fetch("/api/walkthrough/first-lead", { method: "POST" });
      const cj = await created.json();
      s = cj.session;
    }
    setSession(s);
    setStepData(s?.stepData ?? {});
    setValidation(s ? canContinue(s) : { valid: false, missing: [] });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session) return;
    setValidation(canContinue({ ...session, stepData }));
  }, [session, stepData]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (session?.status === "active" && session.currentStep !== "complete") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [session]);

  async function patch(action: string, extra?: Record<string, unknown>) {
    if (!session) return null;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/walkthrough/first-lead/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, stepData, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not save");
        if (json.validation) setValidation(json.validation);
        if (json.session) {
          setSession(json.session);
          setStepData(json.session.stepData);
        }
        return null;
      }
      setSession(json.session);
      setStepData(json.session.stepData);
      setValidation(json.validation ?? canContinue(json.session));
      return json.session as LeadWalkthroughSession;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDraft() {
    await patch("save_draft");
  }

  async function handleContinue() {
    const result = await patch("continue");
    if (result?.currentStep === "complete") {
      router.replace("/walkthrough/first-lead?complete=1");
    }
  }

  async function handleBack() {
    if (!session) return;
    const prev = getPreviousStep(session.currentStep);
    if (!prev) return;
    await patch("go_back", { step: prev });
  }

  async function handleSelectStep(step: WalkthroughStepId) {
    if (!session) return;
    if (!session.completedSteps.includes(step) && step !== session.currentStep) return;
    await patch("go_back", { step });
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading walkthrough…
      </div>
    );
  }

  if (session.currentStep === "complete" || session.status === "complete") {
    return <WalkthroughComplete session={session} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--nova-bg-primary)]">
      <header className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[var(--nova-gold)]" />
          <div>
            <p className="text-sm font-semibold text-slate-100">First Lead Walkthrough</p>
            <p className="text-[10px] text-slate-500">{APP_NAME} · one lead · locked steps</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExitConfirm(true)}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Exit walkthrough
        </button>
      </header>

      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6">
            <p className="text-sm text-slate-200">Save your draft and exit? You can resume from the sidebar later.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setExitConfirm(false)} className="flex-1 rounded-lg border border-slate-600 py-2 text-sm">
                Stay
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveDraft();
                  router.push("/dashboard");
                }}
                className="flex-1 rounded-lg bg-slate-700 py-2 text-sm text-white"
              >
                Save & exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid flex-1 gap-0 lg:grid-cols-[220px_1fr_240px]">
        <aside className="hidden border-r border-slate-800/60 p-4 lg:block">
          <WalkthroughStepTracker
            currentStep={session.currentStep}
            completedSteps={session.completedSteps}
            onSelectStep={handleSelectStep}
          />
        </aside>

        <main className="flex flex-col p-4 sm:p-6">
          <WalkthroughStepForm session={{ ...session, stepData }} onChange={setStepData} />

          {error && (
            <p className="mt-4 flex items-center gap-2 text-sm text-amber-300">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          {showHelp && !validation.valid && (
            <div className="mt-4 rounded-xl border border-amber-800/40 bg-amber-950/30 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-200">
                <HelpCircle className="h-4 w-4" /> Why can&apos;t I continue?
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
                {validation.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-6">
            <button
              type="button"
              disabled={!getPreviousStep(session.currentStep) || busy}
              onClick={handleBack}
              className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-slate-300"
            >
              <Save className="h-4 w-4" /> Save Draft
            </button>
            {!validation.valid && (
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="text-xs text-amber-400 hover:underline"
              >
                Why can&apos;t I continue?
              </button>
            )}
            <button
              type="button"
              disabled={!validation.valid || busy}
              onClick={handleContinue}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--nova-gold)] px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </main>

        <aside className="hidden border-l border-slate-800/60 p-4 xl:block">
          <WalkthroughEvidencePanel session={{ ...session, stepData }} />
        </aside>
      </div>

      <footer className="border-t border-slate-800/60 px-4 py-2 text-center text-[10px] text-slate-600">
        Navigation is locked during this walkthrough. Only this step is active.{" "}
        <Link href="/dashboard" className="text-slate-500 underline" onClick={(e) => { e.preventDefault(); setExitConfirm(true); }}>
          Exit requires save
        </Link>
      </footer>
    </div>
  );
}
