import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProbateResearchWizard } from "@/components/wizards/ProbateResearchWizard";

function WizardContent() {
  return <ProbateResearchWizard />;
}

export default function ProbateResearchWizardPage() {
  return (
    <AppShell title="Probate / Inherited Property Research Wizard" subtitle="Nova Guided Workflow — inherited property research">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading wizard...</p>}>
        <WizardContent />
      </Suspense>
    </AppShell>
  );
}
