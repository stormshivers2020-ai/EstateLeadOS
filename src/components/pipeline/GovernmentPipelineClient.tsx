"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  COUNTY_STATUS_LABELS,
  PIPELINE_DISCLAIMER,
  PIPELINE_STAGE_LABELS,
  type CountyPipelineConfig,
} from "@/lib/types/pipeline";
import { RunEstateLeadOSModal } from "@/components/program/RunEstateLeadOSModal";
import { Landmark, Play, Pause, Settings, AlertTriangle, Loader2, MapPin } from "lucide-react";

interface DashboardData {
  counties: CountyPipelineConfig[];
  totals: {
    active: number;
    signals: number;
    estate: number;
    property: number;
    ready: number;
    verified: number;
    rejected: number;
  };
  recentRuns: Array<{ id: string; countyName: string; status: string; summary?: string | null; startedAt: string }>;
}

export function GovernmentPipelineClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCounty, setRunningCounty] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [selectedCountyForRun, setSelectedCountyForRun] = useState<CountyPipelineConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pipeline");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runCounty(county: CountyPipelineConfig) {
    setRunningCounty(county.countyName);
    setError(null);
    try {
      const res = await fetch(
        `/api/pipeline/${county.stateAbbr}/${encodeURIComponent(county.countyName)}/run`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Run failed");
        return;
      }
      await load();
    } catch {
      setError("Could not run county pipeline.");
    } finally {
      setRunningCounty(null);
    }
  }

  async function pauseCounty(county: CountyPipelineConfig, pause: boolean) {
    await fetch(`/api/pipeline/${county.stateAbbr}/${encodeURIComponent(county.countyName)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: pause ? "pause" : "resume" }),
    });
    await load();
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Maryland county pipelines…
      </div>
    );
  }

  const counties = data?.counties ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
        <div className="flex items-start gap-2">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{PIPELINE_DISCLAIMER}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          {error}
        </div>
      )}

      {totals && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active Counties" value={totals.active} />
          <Stat label="Government Signals" value={totals.signals} />
          <Stat label="Ready for Review" value={totals.ready} />
          <Stat label="Verified Leads" value={totals.verified} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunOpen(true)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Run EstateLeadOS
        </button>
        <Link
          href="/wizards/county-expansion"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          County Expansion Wizard
        </Link>
        <Link href="/market-search" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
          Government Record Search
        </Link>
        <Link href="/review-queue" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
          Review Queue
        </Link>
      </div>

      <RunEstateLeadOSModal
        open={runOpen}
        onClose={() => { setRunOpen(false); setSelectedCountyForRun(null); }}
        countyName={selectedCountyForRun?.countyName}
        stateAbbr={selectedCountyForRun?.stateAbbr}
        defaultAction={selectedCountyForRun ? "find_government_leads" : undefined}
        onComplete={() => load()}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {counties.map((county) => (
          <Card key={county.id} className={county.isProofEngine ? "border-emerald-700/50" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-emerald-400" />
                {county.countyName} County, {county.stateAbbr}
                <Badge variant={county.status === "active" ? "success" : "default"}>
                  {COUNTY_STATUS_LABELS[county.status]}
                </Badge>
                {county.isProofEngine && <Badge variant="info">Proof Engine</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>Signals: {county.signalsFound}</span>
                <span>Estate matches: {county.estateMatches}</span>
                <span>Ready: {county.readyForReview}</span>
                <span>Verified: {county.verifiedLeads}</span>
              </div>
              {county.lastRunAt && (
                <p className="text-xs text-slate-500">Last run: {new Date(county.lastRunAt).toLocaleString()}</p>
              )}
              <div className="mobile-action-row">
                <button
                  type="button"
                  disabled={runningCounty === county.countyName || county.isPaused}
                  onClick={() => runCounty(county)}
                  className="touch-target inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {runningCounty === county.countyName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Run County Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => pauseCounty(county, !county.isPaused)}
                  className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
                >
                  <Pause className="h-3 w-3" />
                  {county.isPaused ? "Resume" : "Pause"}
                </button>
                <Link
                  href={`/wizards/county-expansion?county=${encodeURIComponent(county.countyName)}`}
                  className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-sky-400"
                >
                  <Settings className="h-3 w-3" />
                  Configure Sources
                </Link>
                <button
                  type="button"
                  onClick={() => { setSelectedCountyForRun(county); setRunOpen(true); }}
                  className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-700/50 px-3 py-2 text-xs text-emerald-300"
                >
                  <Play className="h-3 w-3" />
                  Run EstateLeadOS
                </button>
                <Link href="/lead-feed" className="touch-target rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                  View Leads
                </Link>
                <Link href="/review-queue" className="touch-target rounded-lg border border-amber-700/50 px-3 py-2 text-xs text-amber-200">
                  Manual Review Queue
                </Link>
                <Link href="/audit-trail" className="touch-target rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                  View Errors
                </Link>
                <Link href="/settings" className="touch-target rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
                  View Source Registry
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.recentRuns && data.recentRuns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Automation Runs</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.recentRuns.map((run) => (
                <li key={run.id} className="flex justify-between text-slate-300">
                  <span>{run.countyName} — {run.status}</span>
                  <span className="text-xs text-slate-500">{new Date(run.startedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

export { PIPELINE_STAGE_LABELS };
