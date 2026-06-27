import { AppShell } from "@/components/layout/AppShell";
import { WizardsHub } from "@/components/wizards/WizardsHub";

export default function WizardsPage() {
  return (
    <AppShell
      title="Nova Guided Workflows"
      subtitle="Step-by-step workflows powered by SCS Nova"
    >
      <WizardsHub />
    </AppShell>
  );
}
