import { AppShell } from "@/components/layout/AppShell";
import { DocumentCenterClient } from "@/components/documents/DocumentCenterClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function DocumentsPage() {
  const isDemo = isDemoMode();

  return (
    <AppShell
      title="Document Center"
      subtitle="Nova Document Room — templates, lead packets, and professional review queue"
    >
      <DocumentCenterClient isDemo={isDemo} />
    </AppShell>
  );
}
