"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAutomationState,
  startAutomation,
  pauseAutomation,
  stopAutomation,
  resumeAutomation,
  approveAndResume,
  approveLeadDiscoveryWithLeadId,
  rejectApproval,
  type AutomationRun,
  type AutomationApproval,
  type AutomationType,
} from "@/lib/automation";
import { getAutomationButtonLabel } from "@/lib/automation";

interface AutomationContextValue {
  activeRun: AutomationRun | null;
  pendingApprovals: AutomationApproval[];
  refresh: () => void;
  start: (type: AutomationType, options?: { leadId?: string; discoveryMarket?: { state: string; county: string; city?: string } }) => { error?: string };
  pause: () => void;
  stop: () => void;
  resume: () => { error?: string };
  approve: (approvalId: string, notes?: string) => { error?: string };
  approveDiscoveredLeadAndResume: (
    approvalId: string,
    pendingLeadId: string,
    notes?: string
  ) => Promise<{ error?: string; message?: string; leadId?: string }>;
  reject: (approvalId: string, notes?: string) => void;
  buttonLabel: string;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const AutomationContext = createContext<AutomationContextValue | null>(null);

export function AutomationProvider({ children }: { children: ReactNode }) {
  const [activeRun, setActiveRun] = useState<AutomationRun | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<AutomationApproval[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const refresh = useCallback(() => {
    const state = getAutomationState();
    const run = state.activeRunId
      ? state.runs.find((r) => r.id === state.activeRunId) ?? state.runs[0] ?? null
      : state.runs.find((r) => !["completed", "stopped", "cancelled"].includes(r.status)) ?? null;
    setActiveRun(run);
    setPendingApprovals(state.approvals.filter((a) => a.status === "pending"));
    if (run?.status === "waiting_for_approval") {
      setPanelOpen(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const start = useCallback((type: AutomationType, options?: { leadId?: string; discoveryMarket?: { state: string; county: string; city?: string } }) => {
    const result = startAutomation(type, options);
    refresh();
    if (result.run) setPanelOpen(true);
    return { error: result.error };
  }, [refresh]);

  const pause = useCallback(() => {
    if (activeRun) pauseAutomation(activeRun.id);
    refresh();
  }, [activeRun, refresh]);

  const stop = useCallback(() => {
    if (activeRun) stopAutomation(activeRun.id);
    refresh();
  }, [activeRun, refresh]);

  const resume = useCallback(() => {
    if (!activeRun) return { error: "No active run" };
    const result = resumeAutomation(activeRun.id);
    refresh();
    return { error: result.error };
  }, [activeRun, refresh]);

  const approve = useCallback((approvalId: string, notes?: string) => {
    const result = approveAndResume(approvalId, notes);
    refresh();
    return { error: result.error };
  }, [refresh]);

  const approveDiscoveredLeadAndResume = useCallback(
    async (approvalId: string, pendingLeadId: string, notes?: string) => {
      try {
        const res = await fetch(`/api/leads/pending/${pendingLeadId}/approve`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.error ?? "Could not approve lead." };
        }

        const result = approveLeadDiscoveryWithLeadId(approvalId, data.leadId, notes);
        refresh();
        return {
          error: result.error,
          message: result.message,
          leadId: data.leadId as string,
        };
      } catch {
        return { error: "Could not approve lead." };
      }
    },
    [refresh]
  );

  const reject = useCallback((approvalId: string, notes?: string) => {
    rejectApproval(approvalId, notes);
    refresh();
  }, [refresh]);

  const buttonLabel = activeRun ? getAutomationButtonLabel(activeRun.status) : "Start Automation";

  return (
    <AutomationContext.Provider
      value={{
        activeRun,
        pendingApprovals,
        refresh,
        start,
        pause,
        stop,
        resume,
        approve,
        approveDiscoveredLeadAndResume,
        reject,
        buttonLabel,
        panelOpen,
        setPanelOpen,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
}

export function useAutomation() {
  const ctx = useContext(AutomationContext);
  if (!ctx) throw new Error("useAutomation must be used within AutomationProvider");
  return ctx;
}
