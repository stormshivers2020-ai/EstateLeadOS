import { AppShell } from "@/components/layout/AppShell";
import { AutomationPageClient } from "@/components/automation/AutomationPageClient";

export default function AutomationPage() {
  return (
    <AppShell
      title="Automation Control Layer"
      subtitle="Supervised SCS Nova workflow automation — start, pause, approve, and resume processing"
    >
      <AutomationPageClient />
    </AppShell>
  );
}
