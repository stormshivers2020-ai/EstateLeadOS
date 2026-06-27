"use client";

import { useState } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { PROGRAM_RUN_OPTIONS, type ProgramAutomationMode, type ProgramRunAction } from "@/lib/types/program";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";

interface RunEstateLeadOSModalProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  countyName?: string;
  stateAbbr?: string;
  defaultAction?: ProgramRunAction;
  onComplete?: (result: { success: boolean; message: string }) => void;
}

export function RunEstateLeadOSModal({
  open,
  onClose,
  leadId,
  countyName,
  stateAbbr,
  defaultAction,
  onComplete,
}: RunEstateLeadOSModalProps) {
  const [action, setAction] = useState<ProgramRunAction>(defaultAction ?? "find_government_leads");
  const [mode, setMode] = useState<ProgramAutomationMode>("supervised");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/program/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, mode, leadId, countyName, stateAbbr }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? "Run failed");
        onComplete?.({ success: false, message: json.message ?? "Run failed" });
        return;
      }
      setResult(json.message);
      onComplete?.({ success: true, message: json.message });
    } catch {
      setError("Could not run EstateLeadOS program.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-100">Run EstateLeadOS</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-xs text-slate-400">{GLOBAL_DISCLAIMER}</p>

          <div>
            <label className="mb-1 block text-xs text-slate-500">What do you want EstateLeadOS to do?</label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={action}
              onChange={(e) => setAction(e.target.value as ProgramRunAction)}
            >
              {PROGRAM_RUN_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {PROGRAM_RUN_OPTIONS.find((o) => o.id === action)?.description}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Automation mode</label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={mode}
              onChange={(e) => setMode(e.target.value as ProgramAutomationMode)}
            >
              <option value="manual">Manual</option>
              <option value="assisted">Assisted</option>
              <option value="supervised">Supervised Automation</option>
              <option value="full_automation">Full Automation</option>
            </select>
            <p className="mt-1 text-xs text-amber-400/80">
              Even in Full Automation, EstateLeadOS stops before verification, outreach, buyer packet sharing, assignment movement, and payout approval.
            </p>
          </div>

          {result && <p className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">{result}</p>}
          {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={running}
              onClick={run}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run EstateLeadOS
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
