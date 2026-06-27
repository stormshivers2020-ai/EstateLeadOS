import { AppShell } from "@/components/layout/AppShell";
import { MarketSearchClient } from "@/components/leads/MarketSearchClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function MarketSearchPage() {
  return (
    <AppShell
      title="Market Search"
      subtitle="Nova Market Console — internet lead search and CSV import fallback"
    >
      <MarketSearchClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
