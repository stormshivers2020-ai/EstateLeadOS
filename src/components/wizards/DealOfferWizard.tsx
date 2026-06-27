"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, inputClass, selectClass } from "./WizardShell";
import { useLeads } from "@/hooks/useLeads";
import { runDealWizardCalculation } from "@/lib/services/wizards";
import { getBuyerMatchesForLead } from "@/lib/services/buyers";
import { Badge } from "@/components/ui/Badge";

const STEPS = ["Select Lead", "ARV & Value", "Repairs & Costs", "Assignment Fee", "Spread & Buyer", "Deal Confidence"] as const;

export function DealOfferWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads } = useLeads();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [arv, setArv] = useState("280000");
  const [currentValue, setCurrentValue] = useState("245000");
  const [repairs, setRepairs] = useState("35000");
  const [discount, setDiscount] = useState("70");
  const [holding, setHolding] = useState("5000");
  const [closing, setClosing] = useState("8000");
  const [assignmentFee, setAssignmentFee] = useState("15000");
  const [minSpread, setMinSpread] = useState("12000");
  const [result, setResult] = useState<ReturnType<typeof runDealWizardCalculation>>(null);

  const lead = leads.find((l) => l.id === leadId);
  const matches = useMemo(() => (leadId ? getBuyerMatchesForLead(leadId) : []), [leadId]);

  function calculate() {
    const r = runDealWizardCalculation(leadId, {
      estimatedArv: Number(arv),
      estimatedCurrentValue: Number(currentValue),
      estimatedRepairs: Number(repairs),
      investorDiscountPercentage: Number(discount),
      holdingCosts: Number(holding),
      closingCosts: Number(closing),
      targetAssignmentSpread: Number(assignmentFee),
      riskBuffer: Number(minSpread) * 0.1,
    });
    setResult(r);
  }

  return (
    <WizardShell
      title="Offer & Assignment Deal Wizard"
      subtitle="Estimated ranges only — not guaranteed profit or legal advice"
      steps={STEPS}
      step={step}
      onStepChange={(n) => { if (n === 5) calculate(); setStep(n); }}
      onComplete={() => router.push(`/deal-calculator?leadId=${leadId}`)}
      completeLabel="Save Deal Analysis"
      disclaimer="All figures are estimates for workflow planning. Verify with your own due diligence."
    >
      {step === 0 && (
        <WizardField label="Select Lead">
          <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress} — Score {l.dealPotentialScore}</option>)}
          </select>
        </WizardField>
      )}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <WizardField label="Estimated ARV ($)">
            <input className={inputClass} type="number" value={arv} onChange={(e) => setArv(e.target.value)} />
          </WizardField>
          <WizardField label="Current / As-Is Value ($)">
            <input className={inputClass} type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </WizardField>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <WizardField label="Repair Estimate ($)">
            <input className={inputClass} type="number" value={repairs} onChange={(e) => setRepairs(e.target.value)} />
          </WizardField>
          <WizardField label="Investor Discount %">
            <input className={inputClass} type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </WizardField>
          <WizardField label="Holding Costs ($)">
            <input className={inputClass} type="number" value={holding} onChange={(e) => setHolding(e.target.value)} />
          </WizardField>
          <WizardField label="Closing Costs ($)">
            <input className={inputClass} type="number" value={closing} onChange={(e) => setClosing(e.target.value)} />
          </WizardField>
        </div>
      )}
      {step === 3 && (
        <WizardField label="Assignment Fee Target ($)">
          <input className={inputClass} type="number" value={assignmentFee} onChange={(e) => setAssignmentFee(e.target.value)} />
        </WizardField>
      )}
      {step === 4 && (
        <>
          <WizardField label="Minimum Acceptable Spread ($)">
            <input className={inputClass} type="number" value={minSpread} onChange={(e) => setMinSpread(e.target.value)} />
          </WizardField>
          <div className="rounded-lg border border-slate-700 p-3">
            <p className="text-sm font-medium text-slate-300">Top Buyer Match</p>
            {matches[0] ? (
              <p className="text-sm text-slate-400">Buyer {matches[0].buyerId} — Match {matches[0].matchScore}%</p>
            ) : (
              <p className="text-sm text-slate-500">Run buyer match wizard after deal analysis</p>
            )}
          </div>
        </>
      )}
      {step === 5 && result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-500">Investor Buy Price</p>
            <p className="text-lg font-semibold text-sky-400">${result.result.investorMaxOffer.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-500">Offer Range</p>
            <p className="text-lg font-semibold text-emerald-400">${result.result.offerRangeLow.toLocaleString()} – ${result.result.offerRangeHigh.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-500">Assignment Spread</p>
            <p className="text-lg font-semibold text-slate-200">${result.result.estimatedSpread.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-slate-700 p-3">
            <p className="text-xs text-slate-500">Deal Confidence</p>
            <Badge variant="info">{result.result.confidenceLevel.replace(/_/g, " ")}</Badge>
            <p className="mt-1 text-sm text-slate-400">Deal potential: {result.result.dealPotentialScore}/100</p>
          </div>
        </div>
      )}
      {step === 5 && !result && <p className="text-sm text-slate-500">Calculating...</p>}
    </WizardShell>
  );
}
