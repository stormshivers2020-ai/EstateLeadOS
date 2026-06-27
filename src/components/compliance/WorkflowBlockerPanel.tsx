import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BlockerSeverityBadge } from "./ComplianceBadges";
import type { WorkflowBlocker } from "@/lib/types/compliance";
import { ShieldAlert } from "lucide-react";

export function WorkflowBlockerPanel({ blockers }: { blockers: WorkflowBlocker[] }) {
  const active = blockers.filter((b) => b.status === "active");

  if (active.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Blockers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">No active workflow blockers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-700/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-300">
          <ShieldAlert className="h-4 w-4" />
          Active Workflow Blockers ({active.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.map((blocker) => (
          <div
            key={blocker.id}
            className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {blocker.blockerMessage}
                </p>
                <p className="mt-1 text-xs text-sky-300">
                  Required: {blocker.requiredAction}
                </p>
              </div>
              <BlockerSeverityBadge severity={blocker.severity} />
            </div>
            <div className="mt-2 flex gap-3 text-xs text-slate-500">
              <span>Stage: {blocker.workflowStage.replace(/_/g, " ")}</span>
              <span>Type: {blocker.blockerType.replace(/_/g, " ")}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
