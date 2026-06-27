"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ChartSeriesPoint } from "@/lib/types/analytics";
import { Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface AnalyticsBarChartProps {
  title: string;
  explanation: string;
  data: ChartSeriesPoint[];
  loading?: boolean;
  formatAsCurrency?: boolean;
  horizontal?: boolean;
  moneyLabel?: string;
}

export function AnalyticsBarChart({
  title,
  explanation,
  data,
  loading,
  formatAsCurrency,
  horizontal,
  moneyLabel,
}: AnalyticsBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const empty = data.length === 0 || data.every((d) => d.value === 0);

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
        ) : horizontal ? (
          <ul className="space-y-3">
            {data.map((d) => (
              <li key={d.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{d.label}</span>
                  <span className="text-[var(--nova-gold-soft)]">{formatAsCurrency ? formatCurrency(d.value) : d.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--nova-gold)] to-sky-500"
                    style={{ width: `${(d.value / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-44 items-end justify-between gap-2">
            {data.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--nova-gold-soft)]">
                  {formatAsCurrency ? formatCurrency(d.value) : d.value}
                </span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-sky-700 to-[var(--nova-gold)]"
                  style={{ height: `${Math.max(8, (d.value / max) * 120)}px` }}
                />
                <span className="max-w-full truncate text-[9px] text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
