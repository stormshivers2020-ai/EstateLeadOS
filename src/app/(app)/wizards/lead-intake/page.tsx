import { AppShell } from "@/components/layout/AppShell";
import { LeadIntakeWizard } from "@/components/wizards/LeadIntakeWizard";

export default function LeadIntakeWizardPage() {
  return (
    <AppShell title="New Lead Intake Wizard" subtitle="Nova Guided Workflow — add or import a property lead">
      <LeadIntakeWizard />
    </AppShell>
  );
}
