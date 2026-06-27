import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { AnalyticsHubClient } from "@/components/analytics/pages/AnalyticsHubClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function AnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell
      title="Analytics Center"
      subtitle="EstateLeadOS financial, pipeline, packet, and assignment-readiness analytics — Powered by SCS Nova"
      isAdmin={canAccessAdminConsole(session.role)}
    >
      <AnalyticsPageShell>
        <AnalyticsHubClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
