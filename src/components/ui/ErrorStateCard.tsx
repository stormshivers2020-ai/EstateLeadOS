import Link from "next/link";
import type { ErrorStateDefinition } from "@/lib/constants/error-states";
import { AlertTriangle } from "lucide-react";

interface ErrorStateCardProps {
  error: ErrorStateDefinition;
}

export function ErrorStateCard({ error }: ErrorStateCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-100">{error.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{error.message}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-500">
            {error.nextActions.map((action) => (
              <li key={action}>→ {action}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {error.linkHref && error.linkLabel && (
              <Link href={error.linkHref} className="text-sm font-medium text-sky-400 hover:text-sky-300">
                {error.linkLabel}
              </Link>
            )}
            {error.supportTicket && (
              <Link href="/support" className="text-sm font-medium text-slate-400 hover:text-slate-300">
                Create Support Ticket
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
