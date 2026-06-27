"use client";

import Link from "next/link";
import { getAutomationState } from "@/lib/automation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Zap } from "lucide-react";

export function AdminAutomationMonitor() {
  const state = getAutomationState();
  const activeRuns = state.runs.filter((r) => ["running", "waiting_for_approval", "paused", "queued"].includes(r.status));
  const pendingApprovals = state.approvals.filter((a) => a.status === "pending");

  return (
    <Card className="border-[rgba(214,168,79,0.2)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--nova-gold)]" />
          Automation Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--nova-text-muted)]">Active runs</span>
          <Badge variant={activeRuns.length > 0 ? "gold" : "default"}>{activeRuns.length}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--nova-text-muted)]">Pending approvals</span>
          <Badge variant={pendingApprovals.length > 0 ? "warning" : "default"}>{pendingApprovals.length}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--nova-text-muted)]">Total runs</span>
          <span className="text-[var(--nova-text-secondary)]">{state.runs.length}</span>
        </div>
        <Link href="/automation" className="inline-block text-xs text-[var(--nova-blue)] hover:underline">
          Open Automation Control Layer →
        </Link>
      </CardContent>
    </Card>
  );
}
