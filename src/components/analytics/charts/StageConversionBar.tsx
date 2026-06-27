"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ChartSeriesPoint } from "@/lib/types/analytics";
import { Download, Loader2 } from "lucide-react";

interface StageConversionBarProps {
  title: string;
  explanation: string;
  data: ChartSeriesPoint[];
  loading?: boolean;
}

export function StageConversionBar({ title, explanation, data, loading }: StageConversionBarProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const empty = data.every((d) => d.value === 0);

  return (
    <Card className="premium-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-xs text-slate-400">{explanation}</p>
        </div>
        <button type="button" className="text-slate-500 hover:text-[var(--nova-gold)]" title="Export placeholder">
          <Download className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading funnel…
          </div>
        ) : empty ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
            No pipeline data yet
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((d, i) => (
              <li key={d.label} className="relative">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{d.label}</span>
                  <span className="text-sky-300">{d.value}</span>
                </div>
                <div
                  className="h-7 rounded bg-gradient-to-r from-sky-900/60 to-[var(--nova-gold-muted)] transition-all"
                  style={{
                    width: `${Math.max(12, (d.value / max) * 100)}%`,
                    marginLeft: `${i * 2}%`,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
