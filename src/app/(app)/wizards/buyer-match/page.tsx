import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BuyerMatchWizard } from "@/components/wizards/BuyerMatchWizard";

export default function BuyerMatchWizardPage() {
  return (
    <AppShell title="Buyer Match Wizard" subtitle="Nova Guided Workflow — disposition buyer recommendation">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <BuyerMatchWizard />
      </Suspense>
    </AppShell>
  );
}
