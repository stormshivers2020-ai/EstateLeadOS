"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getSessionContext } from "@/lib/config/session";
import { getOrganizationById } from "@/lib/services/admin";
import { isDemoMode } from "@/lib/config/app-mode";

export function OrganizationSettingsClient() {
  const session = getSessionContext();
  const isDemo = isDemoMode();
  const org = isDemo ? getOrganizationById(session.organizationId) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <span className="text-slate-200">{org?.organizationName ?? session.organizationName}</span>
          </div>
          {org && (
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-400">
              <span>Seats: {org.userCount}/{org.seatLimit}</span>
              <span>Lead limit: {org.monthlyLeadLimit}/mo</span>
              <span>States: {org.activeStates.join(", ")}</span>
              <span>Renewal: {org.renewalDate ?? "—"}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
