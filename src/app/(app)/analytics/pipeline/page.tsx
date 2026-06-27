import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { PipelineAnalyticsClient } from "@/components/analytics/pages/PipelineAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function PipelineAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Pipeline Analytics" subtitle="Stage conversion, bottlenecks, and funnel performance" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <PipelineAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
