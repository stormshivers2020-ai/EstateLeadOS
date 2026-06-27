"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell, WizardField, inputClass, selectClass } from "./WizardShell";
import { US_STATES } from "@/lib/constants/us-states";
import { getStateSetupGuide } from "@/lib/services/wizards";
import { Badge } from "@/components/ui/Badge";

const STEPS = ["State Selection", "County Sources", "Probate Lookup", "Deed Lookup", "Outreach Rules", "Document Checklist", "Workflow"] as const;

export function StateSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stateAbbr, setStateAbbr] = useState("TX");
  const [county, setCounty] = useState("Harris");

  const guide = useMemo(() => getStateSetupGuide(stateAbbr, county), [stateAbbr, county]);

  return (
    <WizardShell
      title="State Setup Wizard"
      subtitle="Nationwide market setup — not limited to any single state"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={() => router.push(`/state-deal-kits?state=${stateAbbr}`)}
      completeLabel="Open State Deal Kit"
      disclaimer="Record source URLs and methods are placeholders. Verify with official county and state portals."
    >
      {step === 0 && (
        <WizardField label="Select State">
          <select className={selectClass} value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value)}>
            {US_STATES.map((s) => <option key={s.abbreviation} value={s.abbreviation}>{s.name} ({s.abbreviation})</option>)}
          </select>
          {guide.profile && (
            <div className="mt-3 rounded-lg border border-slate-700 p-3 text-sm text-slate-400">
              <Badge variant="info">{guide.profile.riskRating}</Badge>
              <p className="mt-2">{guide.profile.userWarnings[0] ?? guide.profile.outreachCaution}</p>
            </div>
          )}
        </WizardField>
      )}
      {step === 1 && (
        <WizardField label="County" hint="Primary county for public record research">
          <input className={inputClass} value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Harris" />
          <p className="mt-2 text-xs text-slate-500">
            Supported status varies by county. Manual upload and CSV import available where automated access is blocked.
          </p>
        </WizardField>
      )}
      {step === 2 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-300">
          <p className="font-medium">Probate Court Lookup Method</p>
          <p className="mt-2 text-slate-400">{guide.probateLookup}</p>
        </div>
      )}
      {step === 3 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-300">
          <p className="font-medium">Deed / Land Record Lookup Method</p>
          <p className="mt-2 text-slate-400">{guide.deedLookup}</p>
        </div>
      )}
      {step === 4 && (
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4 text-sm text-amber-200/90">
          <p className="font-medium">Outreach Rules</p>
          <p className="mt-2">{guide.outreachRules}</p>
        </div>
      )}
      {step === 5 && (
        <ul className="space-y-2 text-sm text-slate-400">
          {guide.documentChecklist.length > 0
            ? guide.documentChecklist.map((d) => <li key={d}>• {d}</li>)
            : <li>Run state deal kit to load document checklist</li>}
        </ul>
      )}
      {step === 6 && (
        <ul className="space-y-2 text-sm text-slate-400">
          {guide.recommendedWorkflow.length > 0
            ? guide.recommendedWorkflow.map((w) => <li key={w}>• {w}</li>)
            : ["Select markets", "Import or discover leads", "Run research wizard", "Complete compliance before outreach", "Build document packet"].map((w) => (
              <li key={w}>• {w}</li>
            ))}
        </ul>
      )}
    </WizardShell>
  );
}
