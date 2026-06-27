import { AppShell } from "@/components/layout/AppShell";
import { StateSetupWizard } from "@/components/wizards/StateSetupWizard";

export default function StateSetupWizardPage() {
  return (
    <AppShell title="State Setup Wizard" subtitle="Nova Guided Workflow — nationwide market and record source configuration">
      <StateSetupWizard />
    </AppShell>
  );
}
