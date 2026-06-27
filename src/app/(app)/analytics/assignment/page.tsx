import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { AssignmentAnalyticsClient } from "@/components/analytics/pages/AssignmentAnalyticsClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function AssignmentAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Assignment & Payout Readiness" subtitle="Fee tracking, accrual aging, and payout readiness" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <AssignmentAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
