"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { US_STATES } from "@/lib/constants/us-states";
import { saveDiscoveryMarket } from "@/lib/automation/discoveryMarket";
import { Globe, Loader2, Search, AlertTriangle, CheckCircle2, Landmark } from "lucide-react";

interface DiscoverResponse {
  searchId: string;
  queries: string[];
  hitsScanned: number;
  candidatesFound: number;
  pendingQueued: number;
  duplicatesSkipped: number;
  rejectedSources?: number;
  connectorsRun?: number;
  governmentSourcesOnly?: boolean;
  pending: Array<{ id: string; propertyAddress: string; ownerName: string; sourceUrl: string }>;
  warnings: string[];
  error?: string;
}

export function InternetLeadSearch({ onQueued }: { onQueued?: () => void }) {
  const router = useRouter();
  const [state, setState] = useState("MD");
  const [county, setCounty] = useState("Harford");
  const [city, setCity] = useState("");
  const [governmentOnly, setGovernmentOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoverResponse | null>(null);

  useEffect(() => {
    fetch("/api/settings/government-search")
      .then((r) => r.json())
      .then((d) => setGovernmentOnly(d.governmentSourcesOnly ?? true))
      .catch(() => undefined);
  }, []);

  async function runSearch() {
    setError(null);
    setResult(null);
    if (!county.trim()) {
      setError("Enter a county to search.");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/settings/government-search", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ governmentSourcesOnly: governmentOnly }),
      });
      saveDiscoveryMarket({
        state,
        county: county.trim(),
        city: city.trim() || undefined,
      });
      const res = await fetch("/api/leads/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          county: county.trim(),
          city: city.trim() || undefined,
          maxResults: 12,
          governmentSourcesOnly: governmentOnly,
        }),
      });
      const data = (await res.json()) as DiscoverResponse;
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        return;
      }
      setResult(data);
      if (data.pendingQueued > 0) {
        onQueued?.();
        router.refresh();
      }
    } catch {
      setError("Could not reach the search service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-600 focus:outline-none";

  return (
    <Card className="border-emerald-800/40 bg-gradient-to-br from-emerald-950/20 to-slate-950/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 text-emerald-400" />
          Government Record Search
        </CardTitle>
        <p className="text-sm text-slate-400">
          EstateLeadOS searches official government and public-record sources only. Zillow, Realtor.com, Redfin, and lead sellers are rejected automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-emerald-800/30 bg-emerald-950/20 px-3 py-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={governmentOnly}
            onChange={(e) => setGovernmentOnly(e.target.checked)}
          />
          <span className="text-sm text-slate-300">
            <strong className="text-emerald-300">Government Sources Only</strong> — only official property, deed, probate, GIS, and tax records can create leads.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-500">State</span>
            <select className={inputClass} value={state} onChange={(e) => setState(e.target.value)}>
              {US_STATES.map((s) => (
                <option key={s.abbreviation} value={s.abbreviation}>
                  {s.abbreviation} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-500">County *</span>
            <input
              className={inputClass}
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="e.g. Harris"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-500">City (optional)</span>
            <input
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Houston"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Searching government records…" : "Search government records"}
          </button>
          {result && result.pendingQueued > 0 && (
            <span className="text-sm text-amber-300">
              {result.pendingQueued} lead{result.pendingQueued === 1 ? "" : "s"} awaiting approval below ↓
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Scanned {result.hitsScanned} results · {result.connectorsRun ?? 0} connectors · {result.candidatesFound} government matches · {result.pendingQueued} queued
              {(result.rejectedSources ?? 0) > 0 ? ` · ${result.rejectedSources} rejected` : ""}
              {result.duplicatesSkipped > 0 ? ` · ${result.duplicatesSkipped} duplicates skipped` : ""}
            </div>
            {result.queries.length > 0 && (
              <p className="text-xs text-slate-500">
                Queries: {result.queries.join(" · ")}
              </p>
            )}
            {result.pending.length > 0 && (
              <ul className="space-y-2 text-sm">
                {result.pending.slice(0, 5).map((lead) => (
                  <li key={lead.id} className="rounded border border-amber-900/40 px-3 py-2">
                    <p className="font-medium text-slate-200">{lead.propertyAddress}</p>
                    <p className="text-xs text-slate-500">{lead.ownerName} — pending your approval</p>
                    {lead.sourceUrl && (
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-500 hover:underline"
                      >
                        Source
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {result.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-200/80">{w}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          Maryland connectors: SDAT, MDLandRec, Register of Wills, Harford GIS. Requires <code className="text-slate-400">TAVILY_API_KEY</code>.
          Rejected marketplace sources are logged for audit. Approve each lead before Lead Feed.
        </p>
      </CardContent>
    </Card>
  );
}
