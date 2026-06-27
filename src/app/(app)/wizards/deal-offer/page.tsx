import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DealOfferWizard } from "@/components/wizards/DealOfferWizard";

export default function DealOfferWizardPage() {
  return (
    <AppShell title="Offer / Assignment Deal Wizard" subtitle="Nova Guided Workflow — deal analysis and spread targets">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <DealOfferWizard />
      </Suspense>
    </AppShell>
  );
}
