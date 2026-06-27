"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, selectClass } from "./WizardShell";
import { useLeads } from "@/hooks/useLeads";
import { getResearchNextSteps } from "@/lib/services/wizards";
import { Badge } from "@/components/ui/Badge";

const STEPS = ["Select Lead", "Owner History", "Transfer Path", "Heirs & Contact", "Record Sources", "Missing Docs", "Next Steps"] as const;

export function ProbateResearchWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads } = useLeads();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [transferMethod, setTransferMethod] = useState("will");
  const [heirIdentified, setHeirIdentified] = useState(false);
  const [responsibleParty, setResponsibleParty] = useState("");
  const [sourceChecked, setSourceChecked] = useState(false);
  const [countySource, setCountySource] = useState("");
  const [stateSource, setStateSource] = useState("");
  const [docsComplete, setDocsComplete] = useState(false);
  const [missingDocs, setMissingDocs] = useState<string[]>([]);

  const lead = leads.find((l) => l.id === leadId);
  const nextSteps = useMemo(
    () => getResearchNextSteps({ ownerConfirmed, transferConfirmed, heirIdentified, sourceChecked, docsComplete }),
    [ownerConfirmed, transferConfirmed, heirIdentified, sourceChecked, docsComplete]
  );

  const docOptions = ["Death certificate", "Letters testamentary", "Heir affidavit", "Probate petition", "Deed of distribution", "Tax records"];

  function toggleDoc(doc: string) {
    setMissingDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);
    setDocsComplete(false);
  }

  return (
    <WizardShell
      title="Probate & Inherited Property Research Wizard"
      subtitle="The heart of EstateLeadOS — verify transfer path before outreach"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={() => router.push(leadId ? `/leads/${leadId}` : "/lead-feed")}
      completeLabel="Save Research & View Lead"
      disclaimer="Research support only — not legal advice. Verify all records with county and court sources."
    >
      {step === 0 && (
        <WizardField label="Select Lead">
          <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {leads.length === 0 && <option value="">No leads — run intake wizard first</option>}
            {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress} — {l.ownerName}</option>)}
          </select>
        </WizardField>
      )}
      {step === 1 && lead && (
        <>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm">
            <p className="text-slate-300">Current owner: <strong>{lead.ownerName}</strong></p>
            <p className="text-slate-400">Prior signals: {lead.signals.map((s: { name: string }) => s.name).join(", ") || "None"}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={ownerConfirmed} onChange={(e) => setOwnerConfirmed(e.target.checked)} />
            Owner history confirmed via deed chain
          </label>
        </>
      )}
      {step === 2 && (
        <>
          <WizardField label="Transfer confirmed through">
            <select className={selectClass} value={transferMethod} onChange={(e) => setTransferMethod(e.target.value)}>
              {["will", "estate", "probate_order", "deed", "unknown"].map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </WizardField>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={transferConfirmed} onChange={(e) => setTransferConfirmed(e.target.checked)} />
            Transfer path verified in public records
          </label>
        </>
      )}
      {step === 3 && (
        <>
          <WizardField label="Heir or Responsible Party">
            <input className={selectClass} value={responsibleParty} onChange={(e) => setResponsibleParty(e.target.value)} placeholder="Executor, heir, or authorized contact" />
          </WizardField>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={heirIdentified} onChange={(e) => setHeirIdentified(e.target.checked)} />
            Heir or responsible party identified
          </label>
        </>
      )}
      {step === 4 && (
        <>
          <WizardField label="County Record Source">
            <input className={selectClass} value={countySource} onChange={(e) => setCountySource(e.target.value)} placeholder="Harris County Recorder / Probate Court" />
          </WizardField>
          <WizardField label="State Record Source">
            <input className={selectClass} value={stateSource} onChange={(e) => setStateSource(e.target.value)} placeholder="State probate index or land records portal" />
          </WizardField>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={sourceChecked} onChange={(e) => setSourceChecked(e.target.checked)} />
            County/state record source checked
          </label>
        </>
      )}
      {step === 5 && (
        <>
          <p className="text-sm text-slate-400">Flag missing documents:</p>
          <div className="flex flex-wrap gap-2">
            {docOptions.map((doc) => (
              <button key={doc} type="button" onClick={() => toggleDoc(doc)} className={`rounded border px-2 py-1 text-xs ${missingDocs.includes(doc) ? "border-amber-600 bg-amber-950/30 text-amber-300" : "border-slate-700 text-slate-400"}`}>
                {doc}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={docsComplete} onChange={(e) => setDocsComplete(e.target.checked)} />
            All required documents on file
          </label>
        </>
      )}
      {step === 6 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Generated next research steps:</p>
          <ul className="space-y-2">
            {nextSteps.map((s, i) => (
              <li key={s} className="flex items-start gap-2 text-sm text-slate-400">
                <Badge variant="info">{i + 1}</Badge> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </WizardShell>
  );
}
