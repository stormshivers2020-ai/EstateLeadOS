import { AppShell } from "@/components/layout/AppShell";
import { AdminConsoleClient } from "@/components/admin/AdminConsoleClient";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { isDemoMode } from "@/lib/config/app-mode";

export default function AdminConsolePage() {
  return (
    <AppShell
      title="SCS Nova Admin Console"
      subtitle="SCS Nova Control Layer — platform governance, market licenses, and system health"
      isAdmin
    >
      <AdminRouteGuard>
        <AdminConsoleClient isDemo={isDemoMode()} />
      </AdminRouteGuard>
    </AppShell>
  );
}
