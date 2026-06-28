"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { PofBadge } from "./DealWorkflowBadges";
import { Badge } from "@/components/ui/Badge";
import {
  getBuyers, getBuyerNetworkOverview, getBuyerImportBatches, simulateBuyerCsvImport,
} from "@/lib/services/buyers";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { Users, Upload, Send } from "lucide-react";

const VIEWS = [
  { id: "all", label: "All Buyers" },
  { id: "active", label: "Active" },
  { id: "preferred", label: "Preferred" },
  { id: "needs_pof", label: "Needs POF" },
  { id: "recent", label: "Recently Contacted" },
];

interface BuyerNetworkClientProps { isDemo: boolean }

export function BuyerNetworkClient({ isDemo }: BuyerNetworkClientProps) {
  const [view, setView] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<ReturnType<typeof simulateBuyerCsvImport> | null>(null);

  const overview = useMemo(() => getBuyerNetworkOverview(), [isDemo]);
  const buyers = useMemo(() => getBuyers({
    view: view === "needs_pof" ? undefined : view,
    state: stateFilter || undefined,
    needsPof: view === "needs_pof",
  }), [view, stateFilter, isDemo]);

  const importBatch = isDemo ? getBuyerImportBatches()[0] : null;

  if (!isDemo) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Users}
          title="No buyers added yet"
          description="Add buyers manually or import a buyer list to begin matching leads to buy boxes."
          primaryAction={{ label: "Import Buyer CSV", href: "/buyer-network" }}
          learnHref="/guide"
        />
        <Card>
          <CardContent className="py-6 text-center">
            <button onClick={() => setShowImport(true)} className="rounded-lg border border-sky-600 px-4 py-2 text-sm text-sky-300 hover:bg-sky-900/20">
              <Upload className="mr-2 inline h-4 w-4" /> Import Buyer CSV
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDemoImport = () => {
    setImportResult(simulateBuyerCsvImport([
      { buyerName: "Demo Buyer A", email: "a@test.example", preferredStates: "TX", maxPrice: "300000", cashBuyer: "yes" },
      { buyerName: "Demo Buyer B", phone: "555-0000", preferredStates: "FL", proofOfFundsStatus: "unknown" },
      { buyerName: "", email: "bad" },
    ]));
    setShowImport(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-violet-700/40 bg-violet-900/20 px-4 py-3 text-sm text-violet-200">
        Send packets from Lead Detail → Email Distribution after Final Archive is complete. No auto-send — user approval required.
      </div>

      <div className="rounded-lg border border-sky-700/40 bg-sky-900/20 px-4 py-3 text-sm text-sky-200">
        Buyer Network is tied to acquisition workflow — match buyers to contract interest, not property sale listings you do not own.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Buyers" value={overview.totalBuyers} />
        <StatCard title="Active" value={overview.activeBuyers} />
        <StatCard title="Preferred" value={overview.preferredBuyers} />
        <StatCard title="Needs POF" value={overview.needsPof} />
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} className={`rounded-lg border px-3 py-1.5 text-xs ${view === v.id ? "border-sky-600 bg-sky-900/40 text-sky-200" : "border-slate-700 text-slate-400"}`}>
            {v.label}
          </button>
        ))}
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
          <option value="">All States</option>
          {["TX", "FL", "NC", "GA", "OH"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleDemoImport} className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-600">
          <Upload className="mr-1 inline h-3 w-3" /> CSV Import
        </button>
      </div>

      {(showImport && importResult) && (
        <Card>
          <CardHeader><CardTitle>Import Summary</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <span>Total rows: {importResult.totalRows}</span>
            <span>Valid: {importResult.validRows}</span>
            <span>Invalid: {importResult.invalidRows}</span>
            <span>Created: {importResult.buyersCreated}</span>
            <span>POF missing: {importResult.proofOfFundsMissing}</span>
            <span>Review needed: {importResult.rowsRequiringReview}</span>
          </CardContent>
        </Card>
      )}

      {importBatch && !importResult && (
        <p className="text-xs text-slate-500">Last import: {importBatch.fileName} — {importBatch.buyersCreated} created, {importBatch.duplicatesFound} duplicates</p>
      )}

      <Card>
        <CardHeader><CardTitle>Buyers ({buyers.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                  <th className="pb-2 pr-4">Buyer</th>
                  <th className="pb-2 pr-4">States</th>
                  <th className="pb-2 pr-4">Max Price</th>
                  <th className="pb-2 pr-4">POF</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Closing</th>
                  <th className="pb-2">Send Packet</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr key={b.id} className="border-b border-slate-800">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-200">{b.buyerName}</p>
                      <p className="text-xs text-slate-500">{b.company ?? b.email ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs">{b.preferredStates.join(", ") || "—"}</td>
                    <td className="py-3 pr-4 text-xs">{b.maxPrice ? `$${b.maxPrice.toLocaleString()}` : "—"}</td>
                    <td className="py-3 pr-4"><PofBadge status={b.proofOfFundsStatus} /></td>
                    <td className="py-3 pr-4"><Badge variant={b.status === "preferred" ? "success" : "default"}>{b.status}</Badge></td>
                    <td className="py-3 pr-4 text-xs text-slate-400">{b.closingSpeed}</td>
                    <td className="py-3">
                      {b.email ? (
                        <Link
                          href={`/leads/lead-demo-1?tab=email&recipientEmail=${encodeURIComponent(b.email)}`}
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                        >
                          <Send className="h-3 w-3" /> Send Packet
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-600">No email</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-600">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}
