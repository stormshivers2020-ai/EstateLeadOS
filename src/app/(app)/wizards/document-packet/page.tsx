import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentPacketWizard } from "@/components/wizards/DocumentPacketWizard";

export default function DocumentPacketWizardPage() {
  return (
    <AppShell title="Document Packet Wizard" subtitle="Nova Guided Workflow — professional deal packet assembly">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <DocumentPacketWizard />
      </Suspense>
    </AppShell>
  );
}
