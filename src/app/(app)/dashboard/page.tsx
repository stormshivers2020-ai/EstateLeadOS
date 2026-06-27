import { AppShell } from "@/components/layout/AppShell";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const analytics = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();
  const isAdmin = canAccessAdminConsole(session.role);

  return (
    <AppShell
      title="Command Center"
      subtitle="EstateLeadOS financial, pipeline, packet, and assignment-readiness command system powered by SCS Nova."
      isAdmin={isAdmin}
    >
      <DashboardWidgets metrics={metrics} analytics={analytics} />
    </AppShell>
  );
}
