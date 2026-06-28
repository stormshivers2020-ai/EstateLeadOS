import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPageShell } from "@/components/analytics/AnalyticsPageShell";
import { AttorneyAnalyticsClient } from "@/components/analytics/pages/AttorneyAnalyticsClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export default async function AttorneyAnalyticsPage() {
  const data = getCommandCenterAnalytics();
  const session = isSupabaseMode()
    ? (await getServerSessionContext()) ?? getSessionContext()
    : getSessionContext();

  return (
    <AppShell title="Attorney Review" subtitle="Attorney review workflow — Steps 15–19 — Powered by SCS Nova" isAdmin={canAccessAdminConsole(session.role)}>
      <AnalyticsPageShell>
        <div className="mb-6">
          <DealCommandStepperSection currentStep={16} sectionSteps={[15, 16, 17, 18, 19]} />
        </div>
        <AttorneyAnalyticsClient data={data} />
      </AnalyticsPageShell>
    </AppShell>
  );
}
