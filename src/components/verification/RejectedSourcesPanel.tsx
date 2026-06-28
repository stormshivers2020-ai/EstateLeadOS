"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { INVALID_PROOF_SOURCE_NOTE } from "@/lib/constants/required-packet-items";
import type { RejectedSourceRecord } from "@/lib/types/government";
import { Ban } from "lucide-react";

interface RejectedSourcesPanelProps {
  rejected: RejectedSourceRecord[];
}

export function RejectedSourcesPanel({ rejected }: RejectedSourcesPanelProps) {
  if (rejected.length === 0) return null;

  return (
    <Card className="border-red-900/40 bg-red-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-300">
          <Ban className="h-4 w-4" />
          Rejected Non-Government Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-400">{INVALID_PROOF_SOURCE_NOTE}</p>
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {rejected.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded border border-red-900/30 bg-black/20 px-3 py-2">
              <p className="font-medium text-slate-300">{r.sourceName ?? r.hostname ?? "Unknown source"}</p>
              <p className="text-xs text-red-300">{r.rejectionReason}</p>
              {r.sourceUrl && (
                <p className="mt-1 truncate text-[10px] text-slate-500">{r.sourceUrl}</p>
              )}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-slate-500">
          These sources cannot create verified leads. People-search results may only be contact enrichment.
        </p>
      </CardContent>
    </Card>
  );
}
