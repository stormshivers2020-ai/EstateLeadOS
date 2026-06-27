"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ChartSeriesPoint } from "@/lib/types/analytics";
import { Download, Loader2 } from "lucide-react";

interface AnalyticsLineChartProps {
  title: string;
  explanation: string;
  data: ChartSeriesPoint[];
  loading?: boolean;
  valueLabel?: string;
  secondaryLabel?: string;
  moneyLabel?: string;
}

export function AnalyticsLineChart({
  title,
  explanation,
  data,
  loading,
  valueLabel = "Value",
  secondaryLabel,
  moneyLabel,
}: AnalyticsLineChartProps) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);
  const width = 400;
  const height = 160;
  const pad = 24;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - (d.value / max) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const secondaryPoints = secondaryLabel
    ? data.map((d, i) => {
        const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
        const y = height - pad - ((d.secondary ?? 0) / max) * (height - pad * 2);
        return `${x},${y}`;
      }).join(" ")
    : null;

  const empty = data.every((d) => d.value === 0 && (d.secondary ?? 0) === 0);

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
          <>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={title}>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <line
                  key={t}
                  x1={pad}
                  x2={width - pad}
                  y1={height - pad - t * (height - pad * 2)}
                  y2={height - pad - t * (height - pad * 2)}
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="1"
                />
              ))}
              {secondaryPoints && (
                <polyline fill="none" stroke="rgba(214,168,79,0.5)" strokeWidth="2" points={secondaryPoints} />
              )}
              <polyline fill="none" stroke="#4da3ff" strokeWidth="2.5" points={points} />
              {data.map((d, i) => {
                const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
                const y = height - pad - (d.value / max) * (height - pad * 2);
                return <circle key={d.label} cx={x} cy={y} r="3.5" fill="#4da3ff" />;
              })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.map((d) => (
                <span key={d.label} className="text-[10px] text-slate-500">{d.label}</span>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-sky-400" /> {valueLabel}</span>
              {secondaryLabel && <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-[var(--nova-gold)]" /> {secondaryLabel}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
