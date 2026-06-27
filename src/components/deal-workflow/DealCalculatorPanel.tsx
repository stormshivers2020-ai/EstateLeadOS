"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfidenceBadge } from "./DealWorkflowBadges";
import { CALCULATOR_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import { getLatestCalculation, getDealCalculations } from "@/lib/services/deal-calculator";
import type { FullLeadDetail } from "@/lib/types/crm";
import { Calculator } from "lucide-react";

export function DealCalculatorPanel({ lead, isDemo }: { lead: FullLeadDetail; isDemo: boolean }) {
  const latest = isDemo ? getLatestCalculation(lead.id) : null;
  const history = isDemo ? getDealCalculations(lead.id) : [];
  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-sky-400" />
          Deal Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-slate-500">Estimated deal potential based on available data and user-entered assumptions.</p>
        {!isDemo || !latest ? (
          <p className="text-slate-400">No calculations yet. Open Deal Calculator to enter assumptions.</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <Metric label="Investor Max Offer" value={fmt(latest.investorMaxOffer)} />
              <Metric label="Suggested Seller Offer" value={fmt(latest.suggestedSellerOffer)} />
              <Metric label="Estimated Spread" value={fmt(latest.estimatedSpread)} />
              <Metric label="Offer Range" value={`${fmt(latest.offerRangeLow)} – ${fmt(latest.offerRangeHigh)}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ConfidenceBadge level={latest.confidenceLevel} />
              <span className="text-xs text-slate-500">Last calculated: {new Date(latest.createdAt).toLocaleDateString()}</span>
            </div>
            {latest.warnings.length > 0 && (
              <p className="text-xs text-amber-300">{latest.warnings[0]}</p>
            )}
            {history.length > 1 && (
              <p className="text-xs text-slate-500">{history.length} calculations on file — history preserved.</p>
            )}
          </>
        )}
        <Link href={`/deal-calculator?lead=${lead.id}`} className="inline-block text-sm text-sky-400 hover:underline">
          Open Deal Calculator →
        </Link>
        <p className="text-xs text-slate-600">{CALCULATOR_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-200">{value}</p>
    </div>
  );
}
