"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";
import { AuditSeverityBadge } from "./AdminBadges";
import { Badge } from "@/components/ui/Badge";
import { getPlatformAuditLogs } from "@/lib/services/admin";
import { getSessionContext } from "@/lib/config/session";
import { isDemoMode } from "@/lib/config/app-mode";
import { History } from "lucide-react";

export function AuditTrailClient() {
  const isDemo = isDemoMode();
  const session = getSessionContext();
  const logs = isDemo
    ? getPlatformAuditLogs({ organizationId: session.organizationId })
    : [];

  if (!isDemo) {
    return (
      <EmptyState
        icon={History}
        title="Audit Trail"
        description="Activity audit logs will appear as your organization uses leads, documents, outreach, and compliance workflows."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Audit Trail ({logs.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-500">Append-only logs for {session.organizationName}. SCS Nova Admin can view platform-wide logs.</p>
        <div className="max-h-[500px] space-y-2 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="border-b border-slate-800 pb-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <AuditSeverityBadge severity={l.severity} />
                <Badge variant="default">{l.relatedModule}</Badge>
                <span className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-slate-300">{l.eventDescription}</p>
              <p className="text-xs text-slate-500">{l.userName}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
