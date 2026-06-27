"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell, WizardField, inputClass, selectClass, textareaClass } from "./WizardShell";
import { US_STATES } from "@/lib/constants/us-states";
import { createLeadFromIntake } from "@/lib/services/wizards";
import { isSupabaseMode } from "@/lib/config/runtime";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";

const STEPS = ["Property", "Owner & Transfer", "Financials", "Indicators", "Notes & Import"] as const;

export function LeadIntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [state, setState] = useState("TX");
  const [county, setCounty] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [transferType, setTransferType] = useState("Estate Transfer");
  const [sourceOfRecord, setSourceOfRecord] = useState("Manual entry");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [mortgageStatus, setMortgageStatus] = useState("Unknown");
  const [taxStatus, setTaxStatus] = useState("Current");
  const [probateIndicator, setProbateIndicator] = useState(false);
  const [inheritanceIndicator, setInheritanceIndicator] = useState(true);
  const [urgencyScore, setUrgencyScore] = useState(5);
  const [notes, setNotes] = useState("");
  const [importMode, setImportMode] = useState<"manual" | "csv">("manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setError(null);
    setSaving(true);
    const input = {
      propertyAddress,
      ownerName,
      state,
      county,
      transferType,
      sourceOfRecord,
      estimatedValue: Number(estimatedValue) || 0,
      mortgageStatus,
      taxStatus,
      probateIndicator,
      inheritanceIndicator,
      urgencyScore,
      notes,
    };

    try {
      if (isSupabaseMode()) {
        const res = await fetch("/api/leads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyAddress,
            ownerName,
            state,
            county,
            leadType: probateIndicator
              ? "possible_probate_lead"
              : inheritanceIndicator
                ? "possible_inherited_property"
                : "possible_inherited_property",
            sourceName: sourceOfRecord,
            estateLeadScore: Math.min(95, 40 + urgencyScore * 5),
            dealPotentialScore: Math.min(90, 35 + urgencyScore * 4),
            complianceRiskScore: probateIndicator ? 48 : 35,
            dataConfidenceScore: 55,
            nextAction: "Complete probate/inherited property research wizard",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create lead");
          return;
        }
        router.push(`/leads/${data.lead.id}`);
        router.refresh();
        return;
      }

      const lead = createLeadFromIntake(input);
      router.push(`/leads/${lead.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WizardShell
      title="New Lead Intake Wizard"
      subtitle="Add a property lead manually or prepare for CSV import"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={finish}
      completeLabel={saving ? "Creating…" : "Create Lead"}
      disclaimer={GLOBAL_DISCLAIMER}
    >
      {error && (
        <p className="mb-4 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {step === 0 && (
        <>
          <WizardField label="Property Address" hint="Full street address including city and ZIP">
            <input className={inputClass} value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="1234 Oak Lane, Houston, TX 77009" />
          </WizardField>
          <div className="grid gap-4 sm:grid-cols-2">
            <WizardField label="State">
              <select className={selectClass} value={state} onChange={(e) => setState(e.target.value)}>
                {US_STATES.map((s) => <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>)}
              </select>
            </WizardField>
            <WizardField label="County">
              <input className={inputClass} value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Harris" />
            </WizardField>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <WizardField label="Owner / Heir Name">
            <input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Estate of M. Richardson" />
          </WizardField>
          <WizardField label="Transfer Type">
            <select className={selectClass} value={transferType} onChange={(e) => setTransferType(e.target.value)}>
              {["Estate Transfer", "Probate Order", "Inherited Deed", "Quitclaim", "Family Transfer", "Unknown"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </WizardField>
          <WizardField label="Source of Record" hint="Where did this lead come from?">
            <select className={selectClass} value={sourceOfRecord} onChange={(e) => setSourceOfRecord(e.target.value)}>
              {["Manual entry", "CSV import", "County recorder", "Probate court index", "Tax assessor", "Referral", "Other"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </WizardField>
        </>
      )}
      {step === 2 && (
        <>
          <WizardField label="Estimated Property Value ($)">
            <input className={inputClass} type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="245000" />
          </WizardField>
          <WizardField label="Mortgage Status">
            <select className={selectClass} value={mortgageStatus} onChange={(e) => setMortgageStatus(e.target.value)}>
              {["Unknown", "No mortgage", "Active mortgage", "Paid off", "Delinquent", "Foreclosure risk"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </WizardField>
          <WizardField label="Tax Status">
            <select className={selectClass} value={taxStatus} onChange={(e) => setTaxStatus(e.target.value)}>
              {["Current", "Delinquent", "Tax lien", "Unknown"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </WizardField>
        </>
      )}
      {step === 3 && (
        <>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={probateIndicator} onChange={(e) => setProbateIndicator(e.target.checked)} />
            Probate activity indicated
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={inheritanceIndicator} onChange={(e) => setInheritanceIndicator(e.target.checked)} />
            Inherited property transfer indicated
          </label>
          <WizardField label="Urgency Score (1–10)" hint="How time-sensitive is this lead?">
            <input className={inputClass} type="range" min={1} max={10} value={urgencyScore} onChange={(e) => setUrgencyScore(Number(e.target.value))} />
            <p className="text-sm text-sky-400">{urgencyScore}/10</p>
          </WizardField>
        </>
      )}
      {step === 4 && (
        <>
          <WizardField label="Intake Method">
            <div className="flex gap-3">
              <button type="button" onClick={() => setImportMode("manual")} className={`rounded-lg border px-3 py-2 text-sm ${importMode === "manual" ? "border-sky-600 bg-sky-950/30 text-sky-300" : "border-slate-700 text-slate-400"}`}>Manual entry</button>
              <button type="button" onClick={() => setImportMode("csv")} className={`rounded-lg border px-3 py-2 text-sm ${importMode === "csv" ? "border-sky-600 bg-sky-950/30 text-sky-300" : "border-slate-700 text-slate-400"}`}>CSV import next</button>
            </div>
          </WizardField>
          {importMode === "csv" && (
            <p className="text-xs text-slate-500">After creating this lead, use Settings → Import Sample CSV or Market Search import for batch records.</p>
          )}
          <WizardField label="Notes / Documents to Attach">
            <textarea className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Research notes, document references, heir contact info..." />
          </WizardField>
        </>
      )}
    </WizardShell>
  );
}
