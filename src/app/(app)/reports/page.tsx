import { AppShell } from "@/components/layout/AppShell";
import { ReportsClient } from "@/components/deal-workflow/ReportsClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Deal workflow metrics — estimates and recorded outcomes"
    >
      <ReportsClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
