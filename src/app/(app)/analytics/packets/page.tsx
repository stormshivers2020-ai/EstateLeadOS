import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { PacketAnalyticsClient } from "@/components/analytics/pages/PacketAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function PacketAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Packet & Archive Analytics" subtitle="Print readiness, archive status, and packet throughput" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <PacketAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
