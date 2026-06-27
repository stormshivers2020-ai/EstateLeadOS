import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ComplianceWizardFlow } from "@/components/wizards/ComplianceWizardFlow";

export default function ComplianceWizardPage() {
  return (
    <AppShell title="Compliance Wizard" subtitle="Nova Guided Workflow — safe-to-contact and disclosure review">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <ComplianceWizardFlow />
      </Suspense>
    </AppShell>
  );
}
