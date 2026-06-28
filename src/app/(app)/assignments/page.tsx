import { AppShell } from "@/components/layout/AppShell";
import { AssignmentTrackerClient } from "@/components/deal-workflow/AssignmentTrackerClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";
import { isDemoMode } from "@/lib/config/app-mode";

export default function AssignmentsPage() {
  return (
    <AppShell
      title="Assignment Tracker"
      subtitle="Assignment readiness and fee tracking — Steps 24–25 — Powered by SCS Nova"
    >
      <div className="mb-6">
        <DealCommandStepperSection currentStep={24} sectionSteps={[24, 25, 26]} />
      </div>
      <AssignmentTrackerClient isDemo={isDemoMode()} />
    </AppShell>
  );
}
