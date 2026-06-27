import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { ExecutiveReportsClient } from "@/components/analytics/pages/ExecutiveReportsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function ExecutiveReportsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Executive Reports" subtitle="Printable and archivable SCS Nova operating reports" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <ExecutiveReportsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
