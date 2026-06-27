"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { ConfidenceBadge, DealPotentialBadge } from "./DealWorkflowBadges";
import { CALCULATOR_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import { runCalculatorForLead, getDealCalculations } from "@/lib/services/deal-calculator";
import { getDemoLeadsSummarySync } from "@/lib/services/crm";
import { useLeads } from "@/hooks/useLeads";
import { Calculator } from "lucide-react";

interface DealCalculatorClientProps {
  isDemo: boolean;
  initialLeadId?: string;
}

export function DealCalculatorClient({ isDemo, initialLeadId }: DealCalculatorClientProps) {
  const { leads: supabaseLeads, loading } = useLeads();
  const demoLeads = getDemoLeadsSummarySync();
  const leads = isDemo ? demoLeads : supabaseLeads.map((l) => ({
    id: l.id,
    propertyAddress: l.propertyAddress,
  }));
  const [leadId, setLeadId] = useState(initialLeadId ?? demoLeads[0]?.id ?? "");

  useEffect(() => {
    if (!isDemo && !leadId && leads[0]) {
      setLeadId(leads[0].id);
    }
  }, [isDemo, leadId, leads]);
  const [arv, setArv] = useState(285000);
  const [repairs, setRepairs] = useState(35000);
  const [discount, setDiscount] = useState(70);
  const [holding, setHolding] = useState(4500);
  const [closing, setClosing] = useState(6000);
  const [spread, setSpread] = useState(18000);
  const [riskBuffer, setRiskBuffer] = useState(5000);
  const [result, setResult] = useState<ReturnType<typeof runCalculatorForLead> | null>(null);

  const history = useMemo(() => (leadId ? getDealCalculations(leadId) : []), [leadId, isDemo, result]);

  const handleCalculate = () => {
    if (!leadId) return;
    const calc = runCalculatorForLead(leadId, {
      estimatedArv: arv,
      estimatedRepairs: repairs,
      investorDiscountPercentage: discount,
      holdingCosts: holding,
      closingCosts: closing,
      targetAssignmentSpread: spread,
      riskBuffer,
      buyerType: "Cash investor",
    });
    setResult(calc);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  if (!isDemo) {
    if (loading) {
      return <EmptyState icon={Calculator} title="Deal Calculator" description="Loading leads…" />;
    }
    if (leads.length === 0) {
      return (
        <EmptyState
          icon={Calculator}
          title="Deal Calculator"
          description="Select a lead from Lead Feed or Lead Detail to start entering assumptions and calculating estimated offer ranges."
          action={<Link href="/lead-feed" className="text-sm text-sky-400 hover:underline">Open Lead Feed →</Link>}
        />
      );
    }
  }

  const output = result?.result;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
        {CALCULATOR_DISCLAIMER}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Assumptions — User Entered</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Lead" select value={leadId} onChange={setLeadId} options={leads.map((l) => ({ value: l.id, label: l.propertyAddress }))} />
            <Field label="Estimated ARV ($)" number value={arv} onChange={(v) => setArv(Number(v))} />
            <Field label="Estimated Repairs ($)" number value={repairs} onChange={(v) => setRepairs(Number(v))} />
            <Field label="Investor Discount (%)" number value={discount} onChange={(v) => setDiscount(Number(v))} />
            <Field label="Holding Costs ($)" number value={holding} onChange={(v) => setHolding(Number(v))} />
            <Field label="Closing Costs ($)" number value={closing} onChange={(v) => setClosing(Number(v))} />
            <Field label="Target Assignment Spread ($)" number value={spread} onChange={(v) => setSpread(Number(v))} />
            <Field label="Risk Buffer ($)" number value={riskBuffer} onChange={(v) => setRiskBuffer(Number(v))} />
            <button onClick={handleCalculate} className="w-full rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500">
              Calculate — Save to History
            </button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard title="Investor Max Offer" value={output ? fmt(output.investorMaxOffer) : "—"} />
            <StatCard title="Suggested Seller Offer" value={output ? fmt(output.suggestedSellerOffer) : "—"} />
            <StatCard title="Offer Range Low" value={output ? fmt(output.offerRangeLow) : "—"} />
            <StatCard title="Offer Range High" value={output ? fmt(output.offerRangeHigh) : "—"} />
            <StatCard title="Estimated Spread" value={output ? fmt(output.estimatedSpread) : "—"} />
            <StatCard title="Deal Potential" value={output ? output.dealPotentialScore : "—"} />
          </div>

          {output && (
            <Card>
              <CardContent className="space-y-3 py-4">
                <div className="flex gap-2">
                  <ConfidenceBadge level={output.confidenceLevel} />
                  <DealPotentialBadge score={output.dealPotentialScore} band={output.dealPotentialScore >= 70 ? "Strong Potential" : "Moderate Potential"} />
                </div>
                {output.riskNotes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-400">Risk Notes</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                      {output.riskNotes.slice(0, 4).map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </div>
                )}
                {output.missingData.length > 0 && (
                  <p className="text-xs text-amber-300">Missing data: {output.missingData.join(", ")}</p>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-500">Assumption Summary</p>
                  <ul className="mt-1 text-xs text-slate-400">
                    {output.assumptions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Calculation History ({history.length})</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-slate-500">History preserved — compare previous calculations.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">ARV</th>
                    <th className="pb-2 pr-4">Max Offer</th>
                    <th className="pb-2 pr-4">Seller Offer</th>
                    <th className="pb-2 pr-4">Est. Spread</th>
                    <th className="pb-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800">
                      <td className="py-2 pr-4 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{fmt(c.estimatedArv)}</td>
                      <td className="py-2 pr-4">{fmt(c.investorMaxOffer)}</td>
                      <td className="py-2 pr-4">{fmt(c.suggestedSellerOffer)}</td>
                      <td className="py-2 pr-4">{fmt(c.estimatedSpread)}</td>
                      <td className="py-2"><ConfidenceBadge level={c.confidenceLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label, number, select, value, onChange, options,
}: {
  label: string; number?: boolean; select?: boolean;
  value: string | number; onChange: (v: string) => void;
  options?: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      {select ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200" />
      )}
    </div>
  );
}
