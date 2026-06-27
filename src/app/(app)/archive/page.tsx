import { AppShell } from "@/components/layout/AppShell";
import { ArchiveClient } from "@/components/program/ArchiveClient";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";

export default function ArchivePage() {
  const analytics = getCommandCenterAnalytics();

  return (
    <AppShell
      title="Archive"
      subtitle="Lead packet archive — printable, versioned, review-ready — Powered by SCS Nova"
    >
      <div className="mb-6">
        <ProcessStepMap aggregateCounts={analytics.stepCounts} currentStep={13} compact />
      </div>
      <ArchiveClient />
    </AppShell>
  );
}
