import { AppShell } from "@/components/layout/AppShell";
import { AssignmentTrackerClient } from "@/components/deal-workflow/AssignmentTrackerClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function AssignmentsPage() {
  return (
    <AppShell
      title="Assignment Tracker"
      subtitle="Track contract-interest workflow, buyer matching, disclosures, title status, and recorded outcomes"
    >
      <AssignmentTrackerClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
