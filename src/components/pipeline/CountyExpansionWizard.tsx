"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { US_STATES } from "@/lib/constants/us-states";
import { MARYLAND_COUNTIES } from "@/lib/record-sources/maryland/counties";
import { PIPELINE_DISCLAIMER } from "@/lib/types/pipeline";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  "Choose state",
  "Choose county",
  "Probate / estate source",
  "Property assessment source",
  "Deed / land-record source",
  "Tax source",
  "GIS / parcel source",
  "Automation mode per source",
  "Test sources",
  "Activate county pipeline",
] as const;

function CountyExpansionWizardInner() {
  const params = useSearchParams();
  const initialCounty = params.get("county") ?? "Harford";
  const [step, setStep] = useState(0);
  const [state, setState] = useState("MD");
  const [county, setCounty] = useState(initialCounty);
  const [done, setDone] = useState(false);

  const sources = [
    { id: "md-register-wills", sourceName: "Maryland Register of Wills", sourceType: "probate_estate", trustLevel: "official", requiresManualLogin: false },
    { id: "md-sdat", sourceName: "Maryland SDAT", sourceType: "property_assessment", trustLevel: "official", requiresManualLogin: false },
    { id: "md-mdlandrec", sourceName: "MDLandRec", sourceType: "deed_land_record", trustLevel: "official", requiresManualLogin: true },
    { id: "md-harford-tax", sourceName: "County Tax", sourceType: "tax_record", trustLevel: "official_secondary", requiresManualLogin: false },
    { id: "md-harford-gis", sourceName: "County GIS", sourceType: "gis_parcel_map", trustLevel: "official", requiresManualLogin: false },
  ];

  async function activate() {
    await fetch(`/api/pipeline/${state}/${encodeURIComponent(county)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active", isProofEngine: county === "Harford" }),
    });
    setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <p className="text-lg font-medium text-slate-100">{county} County pipeline activated</p>
          <p className="text-sm text-slate-400">Source registry and county config updated. Run the pipeline from Government Pipeline.</p>
          <Link href="/government-pipeline" className="inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm text-white">
            Open Government Pipeline
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-sm text-slate-400">{PIPELINE_DISCLAIMER}</p>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <p className="text-xs text-slate-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <Card>
        <CardHeader><CardTitle>{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={state} onChange={(e) => setState(e.target.value)}>
              {US_STATES.filter((s) => s.abbreviation === "MD").map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>
              ))}
            </select>
          )}
          {step === 1 && (
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={county} onChange={(e) => setCounty(e.target.value)}>
              {MARYLAND_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {(step >= 2 && step <= 6) && (
            <ul className="space-y-2 text-sm text-slate-300">
              {sources
                .filter((s) => {
                  if (step === 2) return /probate|estate/i.test(s.sourceType);
                  if (step === 3) return /property_assessment/i.test(s.sourceType);
                  if (step === 4) return /deed|land/i.test(s.sourceType);
                  if (step === 5) return /tax/i.test(s.sourceType);
                  if (step === 6) return /gis|parcel/i.test(s.sourceType);
                  return true;
                })
                .map((s) => (
                  <li key={s.id} className="rounded border border-slate-700/50 p-3">
                    <p className="font-medium">{s.sourceName}</p>
                    <p className="text-xs text-slate-500">{s.trustLevel} · {s.requiresManualLogin ? "manual login" : "semi-automated"}</p>
                  </li>
                ))}
            </ul>
          )}
          {step === 7 && (
            <p className="text-sm text-slate-300">
              MDLandRec is marked <strong>manual review only</strong>. SDAT, Register of Wills, and county GIS connectors run in supervised mode. No CAPTCHA or login bypass.
            </p>
          )}
          {step === 8 && (
            <p className="text-sm text-slate-300">
              Use <Link href="/market-search" className="text-sky-400">Government Record Search</Link> or Run County Pipeline to test {county} County sources before activation.
            </p>
          )}
          {step === 9 && (
            <p className="text-sm text-slate-300">
              Activating sets {county} County to <strong>active</strong> in county_pipeline_configs. Leads stop at ready_for_manual_review until you approve.
            </p>
          )}

          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white">
                Continue
              </button>
            ) : (
              <button type="button" onClick={activate} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">
                Activate County Pipeline
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CountyExpansionWizard() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading wizard…</p>}>
      <CountyExpansionWizardInner />
    </Suspense>
  );
}
