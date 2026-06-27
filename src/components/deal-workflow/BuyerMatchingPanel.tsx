"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BuyerMatchBadge, PofBadge } from "./DealWorkflowBadges";
import { getBuyerMatchesForLead, getBuyerById, validateBuyerMatchingForLead } from "@/lib/services/buyers";
import { BUYER_MATCH_DISCLAIMER } from "@/lib/deal-calculator/dealCalculatorTypes";
import type { FullLeadDetail } from "@/lib/types/crm";
import { Users, AlertTriangle } from "lucide-react";

export function BuyerMatchingPanel({ lead, isDemo }: { lead: FullLeadDetail; isDemo: boolean }) {
  const matches = isDemo ? getBuyerMatchesForLead(lead.id) : [];
  const gateCheck = isDemo ? validateBuyerMatchingForLead(lead.id) : { allowed: true, message: null, missingItems: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-400" />
          Buyer Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-slate-500">{BUYER_MATCH_DISCLAIMER}</p>

        {!gateCheck.allowed && (
          <div className="rounded border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            Buyer Matching blocked: {gateCheck.message}
          </div>
        )}

        {!isDemo || matches.length === 0 ? (
          <p className="text-slate-400">No buyer matches yet. Add buyers to Buyer Network first.</p>
        ) : (
          <div className="space-y-2">
            {matches.slice(0, 3).map((m) => {
              const buyer = getBuyerById(m.buyerId);
              return (
                <div key={m.id} className="rounded border border-slate-800 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-200">{buyer?.buyerName ?? m.buyerId}</span>
                    <BuyerMatchBadge score={m.matchScore} band={m.matchBand} />
                  </div>
                  {buyer?.company && <p className="text-xs text-slate-500">{buyer.company}</p>}
                  <div className="mt-1 flex gap-2">
                    <PofBadge status={m.proofOfFundsStatus} />
                    {buyer?.maxPrice && <span className="text-xs text-slate-500">Max: ${buyer.maxPrice.toLocaleString()}</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{m.suggestedNextStep}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/buyer-network" className="text-xs text-sky-400 hover:underline">Buyer Network →</Link>
          <Link href="/assignments" className="text-xs text-sky-400 hover:underline">Assignment Tracker →</Link>
        </div>
      </CardContent>
    </Card>
  );
}
