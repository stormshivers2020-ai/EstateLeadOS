import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { SourceAnalyticsClient } from "@/components/analytics/pages/SourceAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function SourceAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Source Performance" subtitle="Official vs enrichment vs rejected source analytics" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <SourceAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
