"use client";

import { useAutomation } from "./AutomationContext";
import { AutomationControlBar } from "./AutomationControlBar";
import { AutomationApprovalQueue } from "./AutomationApprovalQueue";
import { AutomationRunTimeline } from "./AutomationRunTimeline";
import { AutomationLogViewer } from "./AutomationLogViewer";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { X, Zap } from "lucide-react";
import { AUTOMATION_TYPE_LABELS } from "@/lib/automation";
import { isLocalPreviewMode } from "@/lib/config/runtime";

export function AutomationPanel() {
  const { activeRun, pendingApprovals, panelOpen, setPanelOpen } = useAutomation();
  if (!panelOpen) return null;

  const showApprovals =
    activeRun?.status === "waiting_for_approval" ||
    pendingApprovals.some((a) => a.approvalType === "lead_discovery_approval");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setPanelOpen(false)} aria-hidden />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-[var(--nova-border)] bg-[var(--nova-bg-secondary)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--nova-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--nova-gold)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--nova-text-primary)]">Nova Automation Control</h2>
              <p className="text-[10px] text-[var(--nova-text-muted)]">Supervised workflow automation</p>
            </div>
          </div>
          <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-[var(--nova-text-muted)] hover:bg-white/[0.04]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLocalPreviewMode() && (
            <p className="rounded-lg border border-[rgba(255,180,84,0.25)] bg-[rgba(255,180,84,0.06)] px-3 py-2 text-[10px] text-[var(--nova-orange)]">
              Local Preview Mode uses simulated automation and fictional records. No live public records, payment providers, or bank systems are connected.
            </p>
          )}

          {activeRun ? (
            <>
              <div>
                <p className="nova-label">Current Run</p>
                <p className="mt-1 text-sm font-medium text-[var(--nova-text-primary)]">{AUTOMATION_TYPE_LABELS[activeRun.automationType]}</p>
                <p className="text-xs text-[var(--nova-text-muted)]">Run {activeRun.id}</p>
                {activeRun.status === "waiting_for_approval" && (
                  <p className="mt-2 text-xs text-[var(--nova-orange)]">
                    Automation paused — review pending approvals below to continue.
                  </p>
                )}
              </div>
              <AutomationControlBar run={activeRun} />
              {showApprovals && (
                <div className="space-y-2">
                  <p className="nova-label">Pending Approvals</p>
                  <AutomationApprovalQueue />
                </div>
              )}
              <AutomationRunTimeline runId={activeRun.id} />
              <AutomationLogViewer runId={activeRun.id} limit={8} />
            </>
          ) : (
            <p className="text-sm text-[var(--nova-text-secondary)]">No active automation run. Use Start Automation to begin supervised processing.</p>
          )}

          <p className="text-[10px] leading-relaxed text-[var(--nova-text-muted)]">{GLOBAL_DISCLAIMER}</p>
        </div>
      </aside>
    </>
  );
}
