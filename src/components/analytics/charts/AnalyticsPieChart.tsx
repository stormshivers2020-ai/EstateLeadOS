"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ChartSeriesPoint } from "@/lib/types/analytics";
import { Download, Loader2 } from "lucide-react";

const SLICE_COLORS = ["#d6a84f", "#4da3ff", "#10b981", "#f59e0b", "#8b5cf6", "#64748b", "#ef4444"];

interface AnalyticsPieChartProps {
  title: string;
  explanation: string;
  data: ChartSeriesPoint[];
  loading?: boolean;
  moneyLabel?: string;
}

export function AnalyticsPieChart({ title, explanation, data, loading, moneyLabel }: AnalyticsPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const empty = total === 0;

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct = total ? d.value / total : 0;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  const gradient = slices.map((s) => `${s.color} ${s.start * 100}% ${(s.start + s.pct) * 100}%`).join(", ");

  return (
    <Card className="premium-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-xs text-slate-400">{explanation}</p>
          {moneyLabel && <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--nova-gold)]">{moneyLabel}</p>}
        </div>
        <button type="button" className="text-slate-500 hover:text-[var(--nova-gold)]" title="Export placeholder">
          <Download className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading chart…
          </div>
        ) : empty ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
            No data for selected period
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              className="h-36 w-36 shrink-0 rounded-full ring-2 ring-[var(--nova-gold-muted)]"
              style={{ background: `conic-gradient(${gradient})` }}
              role="img"
              aria-label={title}
            />
            <ul className="flex-1 space-y-2 text-sm">
              {slices.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="text-slate-400">{Math.round(s.pct * 100)}% ({s.value})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
