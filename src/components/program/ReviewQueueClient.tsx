"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { REVIEW_QUEUE_LABELS } from "@/lib/types/program";
import type { ReviewQueueItem } from "@/lib/types/program";
import { ClipboardList, Loader2 } from "lucide-react";
import { RunEstateLeadOSModal } from "./RunEstateLeadOSModal";

export function ReviewQueueClient() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [byType, setByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [runOpen, setRunOpen] = useState(false);
  const [runLeadId, setRunLeadId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/review-queue");
      const json = await res.json();
      setItems(json.items ?? []);
      setByType(json.byType ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? items : items.filter((i) => i.queueType === filter);

  if (loading && items.length === 0) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading review queue…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{GLOBAL_DISCLAIMER}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRunOpen(true)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">
          Run EstateLeadOS
        </button>
        <Link href="/archive" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">Archive</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")} label={`All (${items.length})`} />
        {Object.entries(byType).map(([type, count]) => (
          <FilterBtn
            key={type}
            active={filter === type}
            onClick={() => setFilter(type)}
            label={`${REVIEW_QUEUE_LABELS[type as keyof typeof REVIEW_QUEUE_LABELS] ?? type} (${count})`}
          />
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Review Queue</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400">No items in queue. Run a county pipeline or build packets to populate.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-700/50 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-200">{item.leadTitle ?? item.leadId}</p>
                      <p className="text-xs text-slate-500">
                        {item.countyName}, {item.stateAbbr} · {REVIEW_QUEUE_LABELS[item.queueType]}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Next: {item.nextAction}</p>
                      {item.confidenceScore != null && (
                        <p className="text-xs text-slate-500">Confidence: {item.confidenceScore}</p>
                      )}
                      {item.missingDocumentCount > 0 && (
                        <Badge variant="warning">{item.missingDocumentCount} missing</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/leads/${item.leadId}`} className="rounded border border-slate-600 px-2 py-1 text-xs text-sky-400">
                        Open Lead
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setRunLeadId(item.leadId); setRunOpen(true); }}
                        className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-300"
                      >
                        Run Document Finder
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RunEstateLeadOSModal
        open={runOpen}
        onClose={() => { setRunOpen(false); setRunLeadId(undefined); }}
        leadId={runLeadId}
        defaultAction={runLeadId ? "find_missing_documents" : undefined}
        onComplete={() => load()}
      />
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs ${active ? "bg-sky-700 text-white" : "border border-slate-600 text-slate-400"}`}
    >
      {label}
    </button>
  );
}
