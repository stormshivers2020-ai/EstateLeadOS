import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download } from "lucide-react";

export interface AnalyticsTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface AnalyticsTableProps<T extends object> {
  title: string;
  explanation?: string;
  columns: AnalyticsTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}

export function AnalyticsTable<T extends object>({
  title,
  explanation,
  columns,
  rows,
  emptyMessage = "No records for selected filters",
}: AnalyticsTableProps<T>) {
  return (
    <Card className="premium-panel overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {explanation && <p className="mt-1 text-xs text-slate-400">{explanation}</p>}
        </div>
        <button type="button" className="text-slate-500 hover:text-[var(--nova-gold)]" title="Export placeholder">
          <Download className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-black/20">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/40 hover:bg-white/[0.02]">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-slate-300">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
