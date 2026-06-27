"use client";

import { useState } from "react";
import { AnalyticsDisclaimer } from "@/components/analytics/AnalyticsDisclaimer";
import type { CommandCenterAnalytics } from "@/lib/services/analytics";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { Archive, Printer } from "lucide-react";

const REPORT_TYPES = [
  "Full Business Snapshot",
  "Profit & Loss Report",
  "Accrued Money Report",
  "Pipeline Report",
  "County Performance Report",
  "Source Performance Report",
  "Packet Archive Report",
  "Attorney Review Report",
  "Buyer Distribution Report",
  "Assignment Readiness Report",
  "Payout Readiness Report",
  "Monthly SCS Nova Operating Report",
];

export function ExecutiveReportsClient({ data }: { data: CommandCenterAnalytics }) {
  const [archived, setArchived] = useState<string[]>([]);

  function buildReportHtml(type: string): string {
    const s = data.snapshot;
    return `<!DOCTYPE html><html><head><title>${type}</title><style>
      body{font-family:Georgia,serif;background:#0b0d10;color:#e2e8f0;padding:40px}
      h1{color:#d6a84f} .disclaimer{font-size:11px;color:#94a3b8;margin:20px 0;padding:12px;border:1px solid #334155}
      table{width:100%;border-collapse:collapse;margin-top:20px} td,th{border:1px solid #334155;padding:8px;text-align:left}
    </style></head><body>
      <h1>EstateLeadOS — ${type}</h1>
      <p>Powered by SCS Nova · Generated ${new Date().toLocaleString()}</p>
      <div class="disclaimer">Estimated values, projected assignment fees, accrued amounts, and pipeline values are not guaranteed.</div>
      <table><tr><th>Metric</th><th>Value</th><th>Label</th></tr>
      <tr><td>Est. Pipeline</td><td>${formatCurrency(s.estimatedPipelineValue)}</td><td>Estimated</td></tr>
      <tr><td>Accrued Money</td><td>${formatCurrency(s.totalAccruedMoney)}</td><td>Accrued</td></tr>
      <tr><td>Received Money</td><td>${formatCurrency(s.totalReceivedMoney)}</td><td>Received</td></tr>
      <tr><td>Net P/L</td><td>${formatCurrency(s.netProfitLoss)}</td><td>System-calculated</td></tr>
      </table></body></html>`;
  }

  function handlePrint(type: string) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildReportHtml(type));
    w.document.close();
    w.print();
  }

  function handleArchive(type: string) {
    setArchived((prev) => [...prev, `${type}-v${prev.filter((a) => a.startsWith(type)).length + 1}-${Date.now()}`]);
  }

  return (
    <div className="space-y-8">
      <AnalyticsDisclaimer compact />
      <SectionHeader title="Executive Reports" subtitle="Printable, versioned, archivable SCS Nova operating reports" />

      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <Card key={type} className="premium-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{type}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handlePrint(type)} className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-[var(--nova-gold-muted)]">
                <Printer className="mr-1 h-3.5 w-3.5" /> Print
              </button>
              <button type="button" onClick={() => handleArchive(type)} className="inline-flex items-center rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-[var(--nova-gold-muted)]">
                <Archive className="mr-1 h-3.5 w-3.5" /> Archive Report
              </button>
              <span className="text-[10px] text-slate-500 self-center">Export placeholder</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {archived.length > 0 && (
        <Card className="premium-panel">
          <CardHeader><CardTitle className="text-sm">Archived Report Versions</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-slate-400">
              {archived.map((a) => <li key={a}>✓ {a}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
