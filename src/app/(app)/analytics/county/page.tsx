import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { CountyAnalyticsClient } from "@/components/analytics/pages/CountyAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function CountyAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="County Performance" subtitle="ROI, confidence, and expansion recommendations by county" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <CountyAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
