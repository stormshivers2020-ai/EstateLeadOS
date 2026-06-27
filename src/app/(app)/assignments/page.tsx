import { AppShell } from "@/components/layout/AppShell";
import { AssignmentTrackerClient } from "@/components/deal-workflow/AssignmentTrackerClient";
import { ProcessStepMap } from "@/components/analytics/ProcessStepMap";
import { getCommandCenterAnalytics } from "@/lib/services/analytics";
import { isDemoMode } from "@/lib/config/app-mode";

export default function AssignmentsPage() {
  const analytics = getCommandCenterAnalytics();

  return (
    <AppShell
      title="Assignment Tracker"
      subtitle="Track contract-interest workflow, buyer matching, disclosures, title status, and recorded outcomes"
    >
      <div className="mb-6">
        <ProcessStepMap aggregateCounts={analytics.stepCounts} currentStep={20} compact />
      </div>
      <AssignmentTrackerClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
