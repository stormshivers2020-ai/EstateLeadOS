"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Clock, ExternalLink, Loader2, XCircle } from "lucide-react";

interface PendingLead {
  id: string;
  propertyAddress: string;
  ownerName: string;
  sourceUrl: string;
  state: string;
  county: string;
  estateLeadScore: number;
  snippet: string;
  sourceTitle: string;
  discoveredAt: string;
}

export function LeadApprovalQueue({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/pending", { credentials: "include" });
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch {
      setError("Could not load pending leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/leads/pending/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Approval failed");
        return;
      }
      await load();
      router.refresh();
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/leads/pending/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reject failed");
        return;
      }
      await load();
      router.refresh();
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <Card className={compact ? "border-amber-800/30" : "border-amber-800/40"}>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading approval queue…
        </CardContent>
      </Card>
    );
  }

  if (pending.length === 0 && !error) {
    if (compact) return null;
    return (
      <Card className="border-slate-700/50">
        <CardContent className="py-6 text-center text-sm text-slate-500">
          No leads waiting for approval. Run an internet search to discover new candidates.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-800/40 bg-gradient-to-br from-amber-950/15 to-slate-950/30">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-amber-400" />
          Awaiting Your Approval
          {pending.length > 0 && (
            <Badge variant="warning">{pending.length}</Badge>
          )}
        </CardTitle>
        {!compact && (
          <p className="text-sm text-slate-400">
            Internet discoveries stay here until you approve them. Approved leads move to Lead Feed; rejected leads are discarded.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-amber-300">{error}</p>}
        {pending.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border border-amber-900/40 bg-slate-900/50 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-slate-100">{lead.propertyAddress}</p>
                <p className="text-sm text-slate-400">
                  {lead.ownerName} · {lead.county}, {lead.state}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2">{lead.snippet}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="info">Estate score {lead.estateLeadScore}</Badge>
                  {lead.sourceUrl && (
                    <a
                      href={lead.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                    >
                      View source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={actingId === lead.id}
                  onClick={() => reject(lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-red-700/50 hover:text-red-300 disabled:opacity-50"
                >
                  {actingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actingId === lead.id}
                  onClick={() => approve(lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {actingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))}
        {pending.length > 0 && (
          <p className="text-xs text-slate-500">
            Approved leads appear in{" "}
            <Link href="/lead-feed" className="text-sky-400 hover:underline">
              Lead Feed
            </Link>
            . Run the Probate Research Wizard before outreach.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
