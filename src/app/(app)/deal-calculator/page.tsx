import { AppShell } from "@/components/layout/AppShell";
import { DealCalculatorClient } from "@/components/deal-workflow/DealCalculatorClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default async function DealCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const { lead } = await searchParams;
  const isDemo = isDemoMode();

  return (
    <AppShell
      title="Deal Calculator"
      subtitle="Estimate offer ranges and deal potential using user-entered assumptions"
    >
      <DealCalculatorClient isDemo={isDemo} initialLeadId={lead} />
    </AppShell>
  );
}
