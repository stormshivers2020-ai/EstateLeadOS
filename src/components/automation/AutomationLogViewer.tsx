"use client";

import { getAutomationLogs } from "@/lib/automation";

export function AutomationLogViewer({ runId, leadId, limit = 20 }: { runId?: string; leadId?: string; limit?: number }) {
  let logs = getAutomationLogs(runId);
  if (leadId) logs = logs.filter((l) => l.leadId === leadId);
  logs = logs.slice(0, limit);

  if (logs.length === 0) return <p className="text-xs text-[var(--nova-text-muted)]">No automation logs yet.</p>;

  return (
    <div>
      <p className="nova-label mb-3">Logs</p>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-lg border border-[var(--nova-border)] bg-black/20 px-3 py-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-[var(--nova-text-secondary)]">{log.action}</span>
              <span className="shrink-0 text-[10px] text-[var(--nova-text-muted)]">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1 text-[var(--nova-text-muted)]">{log.message}</p>
            {log.userActionRequired && (
              <span className="mt-1 inline-block text-[10px] text-[var(--nova-orange)]">User action required</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
