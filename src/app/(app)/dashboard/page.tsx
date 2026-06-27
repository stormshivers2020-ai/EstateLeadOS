import { AppShell } from "@/components/layout/AppShell";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();
  const isAdmin = canAccessAdminConsole(session.role);

  return (
    <AppShell
      title="Command Center"
      subtitle="EstateLeadOS operational overview powered by SCS Nova."
      isAdmin={isAdmin}
    >
      <DashboardWidgets metrics={metrics} />
    </AppShell>
  );
}
