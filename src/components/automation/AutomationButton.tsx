"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAutomation } from "./AutomationContext";
import { resolveDiscoveryMarket } from "@/lib/automation/discoveryMarket";
import { cn } from "@/lib/utils/cn";
import { Play, Pause, Square, ChevronDown, ListChecks, ScrollText, Zap } from "lucide-react";
import type { AutomationType } from "@/lib/automation";
import { AUTOMATION_TYPE_LABELS } from "@/lib/automation";
import type { AutomationStatus } from "@/lib/automation";

interface AutomationButtonProps {
  leadId?: string;
  compact?: boolean;
  defaultType?: AutomationType;
}

function statusVariant(status: AutomationStatus | "idle"): string {
  switch (status) {
    case "running": return "border-[rgba(214,168,79,0.5)] bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)] nova-automation-pulse";
    case "waiting_for_approval": return "border-[rgba(255,180,84,0.5)] bg-[rgba(255,180,84,0.12)] text-[var(--nova-orange)]";
    case "blocked":
    case "failed": return "border-[rgba(255,94,94,0.5)] bg-[rgba(255,94,94,0.1)] text-[var(--nova-red)]";
    case "paused":
    case "stopped": return "border-[var(--nova-border)] bg-[var(--nova-panel-soft)] text-[var(--nova-text-secondary)]";
    case "completed": return "border-[rgba(64,217,139,0.3)] bg-[rgba(64,217,139,0.08)] text-[var(--nova-green)]";
    default: return "border-[rgba(214,168,79,0.35)] bg-[var(--nova-panel)] text-[var(--nova-gold-soft)] hover:bg-[var(--nova-gold-muted)]";
  }
}

export function AutomationButton({ leadId, compact, defaultType = "full_lead_to_deal" }: AutomationButtonProps) {
  const { activeRun, buttonLabel, start, pause, stop, resume, setPanelOpen, pendingApprovals } = useAutomation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = activeRun?.status ?? "idle";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const approvalCount = pendingApprovals.length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
          statusVariant(status),
          compact && "px-2 py-1"
        )}
      >
        <Zap className={cn("h-3.5 w-3.5", status === "running" && "text-[var(--nova-gold)]")} />
        {!compact && <span>{buttonLabel}</span>}
        {approvalCount > 0 && (
          <span className="rounded-full bg-[var(--nova-orange)] px-1.5 py-0.5 text-[10px] font-bold text-black">{approvalCount}</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-panel)] py-1 shadow-xl">
          {!activeRun || ["completed", "stopped", "cancelled", "failed"].includes(activeRun.status) ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--nova-text-secondary)] hover:bg-white/[0.04]"
              onClick={() => {
                start(defaultType, { leadId, discoveryMarket: resolveDiscoveryMarket() });
                setMenuOpen(false);
              }}
            >
              <Play className="h-3.5 w-3.5 text-[var(--nova-gold)]" /> Start Processing
            </button>
          ) : (
            <>
              {activeRun.status === "running" && (
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/[0.04]" onClick={() => { pause(); setMenuOpen(false); }}>
                  <Pause className="h-3.5 w-3.5" /> Pause Processing
                </button>
              )}
              {(activeRun.status === "paused" || activeRun.status === "waiting_for_approval") && (
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/[0.04]" onClick={() => { resume(); setMenuOpen(false); }}>
                  <Play className="h-3.5 w-3.5 text-[var(--nova-green)]" /> Resume Processing
                </button>
              )}
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--nova-red)] hover:bg-white/[0.04]" onClick={() => { stop(); setMenuOpen(false); }}>
                <Square className="h-3.5 w-3.5" /> Stop Processing
              </button>
            </>
          )}
          <div className="my-1 border-t border-[var(--nova-border)]" />
          <Link href="/automation?tab=approvals" className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--nova-text-secondary)] hover:bg-white/[0.04]" onClick={() => setMenuOpen(false)}>
            <ListChecks className="h-3.5 w-3.5" /> Review Approval Queue {approvalCount > 0 && `(${approvalCount})`}
          </Link>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/[0.04]" onClick={() => { setPanelOpen(true); setMenuOpen(false); }}>
            <ScrollText className="h-3.5 w-3.5" /> View Automation Run
          </button>
          <Link href="/automation" className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--nova-text-secondary)] hover:bg-white/[0.04]" onClick={() => setMenuOpen(false)}>
            <Zap className="h-3.5 w-3.5" /> Automation Control Layer
          </Link>
          {!activeRun && (
            <>
              <div className="my-1 border-t border-[var(--nova-border)]" />
              <p className="px-3 py-1 text-[10px] text-[var(--nova-text-muted)]">Quick start</p>
              {(Object.keys(AUTOMATION_TYPE_LABELS) as AutomationType[]).slice(0, 4).map((t) => (
                <button key={t} type="button" className="flex w-full px-3 py-1.5 text-left text-[10px] text-[var(--nova-text-muted)] hover:bg-white/[0.04] hover:text-[var(--nova-text-secondary)]" onClick={() => { start(t, { leadId, discoveryMarket: resolveDiscoveryMarket() }); setMenuOpen(false); }}>
                  {AUTOMATION_TYPE_LABELS[t]}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
