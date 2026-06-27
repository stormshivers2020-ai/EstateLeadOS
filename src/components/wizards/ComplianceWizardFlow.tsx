"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, selectClass } from "./WizardShell";
import { US_STATES } from "@/lib/constants/us-states";
import { useLeads } from "@/hooks/useLeads";
import { getComplianceWizardResult } from "@/lib/services/wizards";
import { getStateProfile } from "@/lib/services/compliance";
import { Badge } from "@/components/ui/Badge";
import { NO_ADVICE_DISCLAIMER } from "@/lib/constants/compliance-copy";

const STEPS = ["State", "Outreach Method", "Disclosures", "DNC Check", "Document Checklist", "Risk Flags", "Safe to Contact"] as const;

export function ComplianceWizardFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads } = useLeads();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [stateAbbr, setStateAbbr] = useState("TX");
  const [outreachMethod, setOutreachMethod] = useState("phone");
  const [disclosuresAck, setDisclosuresAck] = useState(false);
  const [dncChecked, setDncChecked] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(false);

  const lead = leads.find((l) => l.id === leadId);
  const profile = getStateProfile(stateAbbr);
  const result = leadId ? getComplianceWizardResult(leadId, stateAbbr) : null;
  const safeToContact = (result?.activeBlockers.length ?? 1) === 0 && disclosuresAck && dncChecked && !lead?.doNotContact;

  return (
    <WizardShell
      title="Compliance Wizard"
      subtitle="State outreach rules, disclosures, and safe-to-contact determination"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={() => router.push("/compliance")}
      completeLabel="Save Compliance Review"
      disclaimer={NO_ADVICE_DISCLAIMER}
    >
      {step === 0 && (
        <>
          <WizardField label="Lead">
            <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress}</option>)}
            </select>
          </WizardField>
          <WizardField label="State">
            <select className={selectClass} value={stateAbbr} onChange={(e) => setStateAbbr(e.target.value)}>
              {US_STATES.map((s) => <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>)}
            </select>
          </WizardField>
          {profile && (
            <div className="rounded-lg border border-slate-700 p-3 text-xs text-slate-400">
              Risk rating: <Badge variant="warning">{profile.riskRating}</Badge>
              <p className="mt-2">{profile.outreachCaution}</p>
            </div>
          )}
        </>
      )}
      {step === 1 && (
        <WizardField label="Allowed Outreach Method">
          <select className={selectClass} value={outreachMethod} onChange={(e) => setOutreachMethod(e.target.value)}>
            {["phone", "email", "sms", "direct_mail", "voicemail"].map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">SMS and phone require consent and DNC checks where applicable.</p>
        </WizardField>
      )}
      {step === 2 && (
        <>
          <ul className="space-y-2 text-sm text-slate-400">
            {(result?.requiredAcknowledgements ?? ["Workflow disclaimer", "No legal advice acknowledgement"]).map((a) => (
              <li key={a} className="flex items-center gap-2"><Badge variant="info">Required</Badge>{a}</li>
            ))}
          </ul>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={disclosuresAck} onChange={(e) => setDisclosuresAck(e.target.checked)} />
            Required disclosures reviewed and acknowledged
          </label>
        </>
      )}
      {step === 3 && (
        <>
          {lead?.doNotContact && <p className="text-sm text-red-400">This lead is marked Do Not Contact.</p>}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={dncChecked} onChange={(e) => setDncChecked(e.target.checked)} />
            Do-not-contact registry and internal DNC list checked
          </label>
        </>
      )}
      {step === 4 && (
        <>
          <ul className="space-y-1 text-sm text-slate-400">
            {(result?.requiredActions ?? ["Seller disclosure", "Compliance acknowledgement", "Source record log"]).map((d) => (
              <li key={d}>• {d}</li>
            ))}
          </ul>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={checklistComplete} onChange={(e) => setChecklistComplete(e.target.checked)} />
            Document checklist reviewed
          </label>
        </>
      )}
      {step === 5 && (
        <div className="space-y-2">
          {(result?.requiredActions ?? ["Manual verification required", "Probate status unconfirmed"]).map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-amber-200/90">
              <Badge variant="warning">Risk</Badge> {f}
            </div>
          ))}
          {(result?.activeBlockers ?? []).map((b) => (
            <div key={b.id} className="text-sm text-red-300">Blocker: {b.blockerMessage}</div>
          ))}
        </div>
      )}
      {step === 6 && (
        <div className={`rounded-lg border p-4 ${safeToContact ? "border-emerald-700/40 bg-emerald-950/20" : "border-amber-700/40 bg-amber-950/20"}`}>
          <p className="text-lg font-semibold text-slate-100">
            {safeToContact ? "Safe to Contact — Proceed with Caution" : "Not Safe to Contact Yet"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {safeToContact
              ? "Compliance checks passed. Use respectful outreach wizard and log all contact."
              : "Complete blockers, DNC checks, and disclosures before outreach."}
          </p>
        </div>
      )}
    </WizardShell>
  );
}
