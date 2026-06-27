"use client";

import { useState } from "react";
import Link from "next/link";
import { useAutomation } from "./AutomationContext";
import { AutomationControlBar } from "./AutomationControlBar";
import { AutomationApprovalQueue } from "./AutomationApprovalQueue";
import { AutomationLogViewer } from "./AutomationLogViewer";
import { AutomationRunTimeline } from "./AutomationRunTimeline";
import { AutomationPayoutReadinessPanel } from "./AutomationPayoutReadinessPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AUTOMATION_TYPE_LABELS, type AutomationType } from "@/lib/automation";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { Zap } from "lucide-react";

const TABS = ["control", "approvals", "logs", "payout"] as const;
type Tab = (typeof TABS)[number];

export function AutomationPageClient() {
  const { activeRun, pendingApprovals, start } = useAutomation();
  const [tab, setTab] = useState<Tab>("control");

  return (
    <div className="space-y-8">
      {isLocalPreviewMode() && (
        <Card className="border-[rgba(255,180,84,0.25)] bg-[rgba(255,180,84,0.06)]">
          <CardContent className="py-3 text-xs text-[var(--nova-orange)]">
            Local Preview Mode uses simulated automation and fictional records. No live public records, payment providers, or bank systems are connected.
          </CardContent>
        </Card>
      )}

      <SectionHeader
        title="Nova Automation Control Layer"
        subtitle="Start processing, pause for approval, resume after review — supervised workflow automation"
      />

      {pendingApprovals.length > 0 && (
        <Link href="/automation?tab=approvals" className="block rounded-lg border border-[rgba(255,180,84,0.4)] bg-[rgba(255,180,84,0.08)] px-4 py-3 text-sm text-[var(--nova-orange)] hover:border-[rgba(255,180,84,0.6)]">
          {pendingApprovals.length} approval(s) needed — automation is paused until reviewed.
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors ${
              tab === t
                ? "border-[rgba(214,168,79,0.4)] bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)]"
                : "border-[var(--nova-border)] text-[var(--nova-text-muted)]"
            }`}
          >
            {t === "control" ? "Control Panel" : t}
            {t === "approvals" && pendingApprovals.length > 0 && ` (${pendingApprovals.length})`}
          </button>
        ))}
      </div>

      {tab === "control" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {activeRun ? (
              <AutomationControlBar run={activeRun} />
            ) : (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[var(--nova-gold)]" />
                    <p className="font-medium text-[var(--nova-text-primary)]">No active automation run</p>
                  </div>
                  <p className="text-sm text-[var(--nova-text-secondary)]">
                    Select an automation type to begin supervised processing. Automation pauses at approval gates and never auto-sends outreach or transfers funds.
                  </p>
                  <div className="grid gap-2">
                    {(Object.keys(AUTOMATION_TYPE_LABELS) as AutomationType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => start(type)}
                        className="rounded-lg border border-[var(--nova-border)] px-4 py-2.5 text-left text-sm text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-gold)] hover:text-[var(--nova-gold-soft)]"
                      >
                        {AUTOMATION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {activeRun && <AutomationRunTimeline runId={activeRun.id} />}
        </div>
      )}

      {tab === "approvals" && <AutomationApprovalQueue />}
      {tab === "logs" && <AutomationLogViewer limit={50} />}
      {tab === "payout" && <AutomationPayoutReadinessPanel />}

      <p className="text-xs leading-relaxed text-[var(--nova-text-muted)]">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}
