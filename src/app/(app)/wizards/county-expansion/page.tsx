import { AppShell } from "@/components/layout/AppShell";
import { CountyExpansionWizard } from "@/components/pipeline/CountyExpansionWizard";

export default function CountyExpansionWizardPage() {
  return (
    <AppShell title="County Expansion Wizard" subtitle="Configure official government sources per county — Powered by SCS Nova">
      <CountyExpansionWizard />
    </AppShell>
  );
}
