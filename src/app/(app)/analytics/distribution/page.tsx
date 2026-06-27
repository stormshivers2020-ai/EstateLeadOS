import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { DistributionAnalyticsClient } from "@/components/analytics/pages/DistributionAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function DistributionAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Buyer / Realtor Distribution" subtitle="Approved sends and buyer response analytics" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <DistributionAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
