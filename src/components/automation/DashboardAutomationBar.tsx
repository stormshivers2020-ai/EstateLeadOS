"use client";

import Link from "next/link";
import { AutomationButton } from "./AutomationButton";
import { useAutomation } from "./AutomationContext";

export function DashboardAutomationBar() {
  const { pendingApprovals } = useAutomation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-panel)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--nova-text-primary)]">Nova Automation Control</p>
        <p className="text-xs text-[var(--nova-text-muted)]">
          {pendingApprovals.length > 0
            ? `${pendingApprovals.length} approval(s) needed — automation paused`
            : "Searches the internet for leads first, then waits for your approval before continuing"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pendingApprovals.length > 0 && (
          <Link href="/automation?tab=approvals" className="text-xs text-[var(--nova-orange)] hover:underline">
            Review Approvals
          </Link>
        )}
        <AutomationButton defaultType="full_lead_to_deal" />
      </div>
    </div>
  );
}
