import { AppShell } from "@/components/layout/AppShell";
import { BuyerNetworkClient } from "@/components/deal-workflow/BuyerNetworkClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function BuyerNetworkPage() {
  return (
    <AppShell
      title="Buyer Network"
      subtitle="Organize buyers, buy boxes, proof-of-funds status, and match opportunities responsibly"
    >
      <BuyerNetworkClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
