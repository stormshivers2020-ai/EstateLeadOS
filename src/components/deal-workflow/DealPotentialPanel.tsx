"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DealPotentialBadge, ConfidenceBadge } from "./DealWorkflowBadges";
import { getDealPotentialScore, computeDealPotentialForLead } from "@/lib/services/deal-calculator";
import type { FullLeadDetail } from "@/lib/types/crm";
import { TrendingUp } from "lucide-react";

export function DealPotentialPanel({ lead, isDemo }: { lead: FullLeadDetail; isDemo: boolean }) {
  const record = isDemo
    ? getDealPotentialScore(lead.id) ?? computeDealPotentialForLead(lead.id)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Deal Potential Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-slate-500">Estimated deal potential based on available data and user-entered assumptions. Not guaranteed profit.</p>
        {!record ? (
          <p className="text-slate-400">Run Deal Calculator to generate deal potential analysis.</p>
        ) : (
          <>
            <DealPotentialBadge score={record.score} band={record.scoreBand} />
            <ConfidenceBadge level={record.confidenceLevel} />
            {record.positiveFactors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-400">Positive factors</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                  {record.positiveFactors.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
            {record.negativeFactors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-400">Negative factors</p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                  {record.negativeFactors.slice(0, 4).map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
            {record.missingData.length > 0 && (
              <p className="text-xs text-slate-500">Missing: {record.missingData.join(", ")}</p>
            )}
            <p className="text-xs text-slate-500">Updated: {new Date(record.calculatedAt).toLocaleDateString()}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
