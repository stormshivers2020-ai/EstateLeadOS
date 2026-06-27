"use client";

import { useState } from "react";
import Link from "next/link";
import { InternetLeadSearch } from "@/components/leads/InternetLeadSearch";
import { LeadApprovalQueue } from "@/components/leads/LeadApprovalQueue";
import { FeatureGateNotice } from "@/components/platform/FeatureGateNotice";
import { MarketLicensePanel } from "@/components/platform/MarketLicensePanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, Upload, X, Filter } from "lucide-react";

const FILTER_OPTIONS = [
  "State", "County", "Lead Type", "Estate Score", "Deal Potential",
  "Compliance Risk", "Property Type", "Source Reliability", "Absentee Owner",
] as const;

const SAVED_VIEWS = ["All Licensed Markets", "High Confidence", "Research Queue", "CSV Import Ready"] as const;

export function MarketSearchClient({ isDemo }: { isDemo: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(isDemo ? ["TX", "Harris County"] : []);
  const [approvalRefresh, setApprovalRefresh] = useState(0);

  function toggleFilter(f: string) {
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }

  return (
    <FeatureGateNotice feature="market_search">
      <div className="space-y-6">
        <SectionHeader
          title="Market Search"
          subtitle="Search the internet for probate and inherited property leads in your target market"
          action={
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-sky-600/50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          }
        />

        {drawerOpen && (
          <Card className="border-sky-800/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filter Drawer</span>
                <button type="button" onClick={() => setActiveFilters([])} className="text-xs text-slate-400 hover:text-slate-200">Reset filters</button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFilter(f)} className={`rounded-full border px-3 py-1 text-xs ${activeFilters.includes(f) ? "border-sky-600 bg-sky-950/40 text-sky-300" : "border-slate-700 text-slate-400"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Saved Views</p>
                <div className="flex flex-wrap gap-2">
                  {SAVED_VIEWS.map((v) => (
                    <Badge key={v} variant="default">{v}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Active:</span>
            {activeFilters.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 rounded-full border border-sky-700/40 bg-sky-950/30 px-2.5 py-0.5 text-xs text-sky-300">
                {f}
                <button type="button" onClick={() => toggleFilter(f)} aria-label={`Remove ${f}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}

        <InternetLeadSearch onQueued={() => setApprovalRefresh((n) => n + 1)} />

        <LeadApprovalQueue key={approvalRefresh} />

        <MarketLicensePanel />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4 text-sky-400" /> Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>After internet search, filter leads by state, county, lead type, estate score, compliance risk, and source confidence in the Lead Feed.</p>
              <Link href="/lead-feed" className="inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-sky-600/50">
                Open Lead Feed
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4 text-emerald-400" /> CSV Import Fallback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>When internet search does not return enough leads, import a CSV with column mapping and duplicate detection.</p>
              <Link href="/market-search?import=csv" className="inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500">Import CSV</Link>
            </CardContent>
          </Card>
        </div>

        {!isDemo && (
          <Card className="border-slate-700/50">
            <CardContent className="py-8 text-center text-sm text-slate-400">
              No leads match this search yet. Run an internet lead search above, widen your filters, or use CSV import as a fallback.
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGateNotice>
  );
}
