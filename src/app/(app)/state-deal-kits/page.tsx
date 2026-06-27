import { AppShell } from "@/components/layout/AppShell";
import { StateDealKitClient } from "@/components/compliance/StateDealKitClient";
import { isDemoMode } from "@/lib/config/app-mode";
import {
  getCountiesForState,
  getStateProfiles,
} from "@/lib/services/compliance";
export default function StateDealKitsPage() {
  const states = getStateProfiles();
  const isDemo = isDemoMode();

  const countiesByState: Record<string, ReturnType<typeof getCountiesForState>> = {};
  for (const s of states) {
    countiesByState[s.stateAbbreviation] = getCountiesForState(s.stateAbbreviation);
  }

  return (
    <AppShell
      title="State Deal Kits"
      subtitle="State-by-state workflows, equipment, documents, and compliance rules"
    >
      <StateDealKitClient
        states={states}
        countiesByState={countiesByState}
        isDemo={isDemo}
      />
    </AppShell>
  );
}
