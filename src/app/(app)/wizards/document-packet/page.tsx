import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentPacketWizard } from "@/components/wizards/DocumentPacketWizard";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";

export default function DocumentPacketWizardPage() {
  return (
    <AppShell title="Document Packet Builder" subtitle="Nova Guided Workflow — Steps 12–13 acquisition & signature-ready drafts">
      <div className="mb-6">
        <DealCommandStepperSection currentStep={13} sectionSteps={[12, 13, 14]} />
      </div>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <DocumentPacketWizard />
      </Suspense>
    </AppShell>
  );
}
