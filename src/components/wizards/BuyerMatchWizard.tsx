"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardShell, WizardField, selectClass } from "./WizardShell";
import { useLeads } from "@/hooks/useLeads";
import { getBuyers, getBuyerMatchesForLead } from "@/lib/services/buyers";
import { Badge } from "@/components/ui/Badge";

const STEPS = ["Select Lead", "Buyer Type", "Market Area", "Deal Size", "Property Type", "Cash Status", "Recommendation"] as const;

export function BuyerMatchWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { leads } = useLeads();
  const buyers = getBuyers();
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState(params.get("leadId") ?? leads[0]?.id ?? "");
  const [buyerType, setBuyerType] = useState("cash_investor");
  const [marketArea, setMarketArea] = useState("");
  const [dealSize, setDealSize] = useState("mid");
  const [propertyType, setPropertyType] = useState("single_family");
  const [cashOnly, setCashOnly] = useState(true);

  const lead = leads.find((l) => l.id === leadId);
  const matches = useMemo(() => getBuyerMatchesForLead(leadId), [leadId]);

  const filtered = useMemo(() => buyers.filter((b) => {
    if (cashOnly && !b.cashBuyer && b.proofOfFundsStatus !== "on_file") return false;
    if (marketArea && !b.preferredStates.some((s) => s.includes(marketArea))) return false;
    if (propertyType !== "any" && b.propertyTypes.length > 0 && !b.propertyTypes.includes(propertyType)) return false;
    return b.status === "active" || b.status === "preferred";
  }), [buyers, cashOnly, marketArea, propertyType]);

  const topMatch = matches[0];
  const topBuyer = topMatch
    ? buyers.find((b) => b.id === topMatch.buyerId)
    : filtered[0];
  const recommendationName = topBuyer?.buyerName ?? null;
  const recommendationScore = topMatch?.matchScore;

  return (
    <WizardShell
      title="Buyer Match Wizard"
      subtitle="Match disposition buyers to inherited-property opportunities"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      onComplete={() => router.push("/buyer-network")}
      completeLabel="View Buyer Network"
    >
      {step === 0 && (
        <WizardField label="Select Lead">
          <select className={selectClass} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.propertyAddress}</option>)}
          </select>
        </WizardField>
      )}
      {step === 1 && (
        <WizardField label="Buyer Type">
          <select className={selectClass} value={buyerType} onChange={(e) => setBuyerType(e.target.value)}>
            {["cash_investor", "hedge_fund", "local_flipper", "buy_and_hold", "wholesaler"].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </WizardField>
      )}
      {step === 2 && (
        <WizardField label="Market Area (state)">
          <select className={selectClass} value={marketArea || lead?.state || "TX"} onChange={(e) => setMarketArea(e.target.value)}>
            {[lead?.state, "TX", "FL", "OH", "GA", "NC"].filter(Boolean).map((s) => (
              <option key={s} value={s!}>{s}</option>
            ))}
          </select>
        </WizardField>
      )}
      {step === 3 && (
        <WizardField label="Preferred Deal Size">
          <select className={selectClass} value={dealSize} onChange={(e) => setDealSize(e.target.value)}>
            {["small", "mid", "large", "portfolio"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </WizardField>
      )}
      {step === 4 && (
        <WizardField label="Property Type">
          <select className={selectClass} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            {["single_family", "multi_family", "land", "commercial", "any"].map((p) => (
              <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
            ))}
          </select>
        </WizardField>
      )}
      {step === 5 && (
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={cashOnly} onChange={(e) => setCashOnly(e.target.checked)} />
          Cash buyer with proof of funds preferred
        </label>
      )}
      {step === 6 && (
        <div className="space-y-4">
          {recommendationName ? (
            <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-4">
              <p className="font-medium text-emerald-300">Best Buyer Recommendation</p>
              <p className="mt-1 text-lg text-slate-100">{recommendationName}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="success">Match {recommendationScore ? `${recommendationScore}%` : "Strong"}</Badge>
                {topBuyer?.lastContacted && (
                  <Badge variant="default">Last contact: {topBuyer.lastContacted}</Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No matching buyers — add buyers in Buyer Network or adjust filters.</p>
          )}
          <p className="text-xs text-slate-500">{filtered.length} buyer(s) match current criteria</p>
        </div>
      )}
    </WizardShell>
  );
}
