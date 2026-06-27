"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { NO_ADVICE_DISCLAIMER, SOURCE_WARNING } from "@/lib/constants/compliance-copy";
import { isSupabaseMode } from "@/lib/config/runtime";
import { SESSION_COOKIE, ONBOARDING_COOKIE } from "@/lib/auth/route-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STEPS = [
  "Welcome",
  "Organization",
  "Role",
  "Markets",
  "Disclaimer",
  "Mode",
  "Data Source",
  "Complete",
] as const;

const US_STATES = ["TX", "FL", "OH", "GA", "NC", "AZ", "PA"];
const COUNTIES = ["Harris, TX", "Duval, FL", "Franklin, OH", "Maricopa, AZ"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("org_admin");
  const [states, setStates] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [mode, setMode] = useState<"demo" | "fresh">("fresh");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleState(s: string) {
    setStates((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleCounty(c: string) {
    setCounties((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  async function finish() {
    setError(null);
    setSaving(true);
    try {
      if (isSupabaseMode()) {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationName: orgName,
            role,
            activeStates: states,
            activeCounties: counties,
            disclaimerAcknowledged: disclaimerAck,
            workspaceMode: mode,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Setup failed");
          return;
        }
      } else {
        document.cookie = `${SESSION_COOKIE}=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        document.cookie = `${ONBOARDING_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="premium-panel rounded-xl p-5">
        <p className="text-sm text-slate-300">
          EstateLeadOS helps you organize inherited-property research, lead scoring, state-specific deal preparation, respectful outreach, document readiness, buyer matching, and assignment tracking in one operational system.
        </p>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>Setup progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <Badge key={s} variant={i === step ? "info" : i < step ? "success" : "default"}>{i + 1}. {s}</Badge>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Welcome to EstateLeadOS</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Nationwide inherited-property lead intelligence, workflow, and compliance-aware acquisition operations.</p>
            <p className="text-slate-400">{NO_ADVICE_DISCLAIMER}</p>
            <button type="button" onClick={() => setStep(1)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Confirm Organization</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
            <button type="button" disabled={!orgName.trim()} onClick={() => setStep(2)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Select Role</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {["solo_investor", "acquisition_manager", "org_admin"].map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-slate-300">
                <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
                {r.replace(/_/g, " ")}
              </label>
            ))}
            <button type="button" onClick={() => setStep(3)} className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Select States &amp; Counties</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {US_STATES.map((s) => (
                <button key={s} type="button" onClick={() => toggleState(s)} className={`rounded border px-3 py-1 text-sm ${states.includes(s) ? "border-sky-600 text-sky-300" : "border-slate-700 text-slate-400"}`}>{s}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COUNTIES.map((c) => (
                <button key={c} type="button" onClick={() => toggleCounty(c)} className={`rounded border px-3 py-1 text-sm ${counties.includes(c) ? "border-sky-600 text-sky-300" : "border-slate-700 text-slate-400"}`}>{c}</button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(4)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review Disclaimer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>{GLOBAL_DISCLAIMER}</p>
            <p>{SOURCE_WARNING}</p>
            <label className="flex items-start gap-2 text-slate-300">
              <input type="checkbox" checked={disclaimerAck} onChange={(e) => setDisclaimerAck(e.target.checked)} className="mt-1" />
              I understand and acknowledge this disclaimer.
            </label>
            <button type="button" disabled={!disclaimerAck} onClick={() => setStep(5)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle>Choose Workspace Mode</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setMode("demo")} className={`rounded-lg border p-4 text-left ${mode === "demo" ? "border-sky-600" : "border-slate-700"}`}>
              <p className="font-medium text-slate-100">Demo Mode</p>
              <p className="mt-1 text-xs text-slate-400">Explore with fictional sample data across every module. Set NEXT_PUBLIC_DEMO_MODE=true in environment.</p>
            </button>
            <button type="button" onClick={() => setMode("fresh")} className={`rounded-lg border p-4 text-left ${mode === "fresh" ? "border-sky-600" : "border-slate-700"}`}>
              <p className="font-medium text-slate-100">Fresh Start</p>
              <p className="mt-1 text-xs text-slate-400">Start with a clean workspace and no demo records.</p>
            </button>
            <p className="sm:col-span-2 text-xs text-slate-500">Demo vs fresh-start is controlled by NEXT_PUBLIC_DEMO_MODE environment variable. Selection here records your preference for setup.</p>
            <button type="button" onClick={() => setStep(6)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Continue</button>
          </CardContent>
        </Card>
      )}

      {step === 6 && (
        <Card>
          <CardHeader><CardTitle>Import CSV or Configure Data Source</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>Import a CSV as fallback, or configure an approved public-record data source when available.</p>
            <p className="text-slate-400">{SOURCE_WARNING}</p>
            <div className="flex gap-3">
              <Link href="/market-search" className="rounded-lg border border-slate-600 px-4 py-2 hover:border-sky-600">CSV Import</Link>
              <button type="button" onClick={() => setStep(7)} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500">Skip for now</button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 7 && (
        <Card>
          <CardHeader><CardTitle>Setup Complete</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p>Your EstateLeadOS workspace is ready. SCS Nova has prepared your command center, workflow modules, and next recommended actions.</p>
            <p>Organization <strong className="text-[var(--nova-text-primary)]">{orgName}</strong> · Markets: {states.join(", ") || "none selected"} · Mode: {mode === "demo" ? "Demo" : "Fresh Start"}</p>
            {error && (
              <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">{error}</p>
            )}
            <button type="button" onClick={finish} disabled={saving} className="nova-btn-primary rounded-lg px-4 py-2 disabled:opacity-50">
              {saving ? "Saving…" : "Open Command Center"}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
