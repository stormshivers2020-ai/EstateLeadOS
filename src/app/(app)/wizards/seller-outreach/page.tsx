import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SellerOutreachWizard } from "@/components/wizards/SellerOutreachWizard";

export default function SellerOutreachWizardPage() {
  return (
    <AppShell title="Seller Outreach Wizard" subtitle="Nova Guided Workflow — respectful outreach scripts and contact log">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <SellerOutreachWizard />
      </Suspense>
    </AppShell>
  );
}
