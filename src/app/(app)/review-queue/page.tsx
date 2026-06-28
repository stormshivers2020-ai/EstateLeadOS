import { AppShell } from "@/components/layout/AppShell";
import { ReviewQueueClient } from "@/components/program/ReviewQueueClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";

export default function ReviewQueuePage() {
  return (
    <AppShell
      title="Review Queue"
      subtitle="Manual review, attorney review, packets, and compliance — Powered by SCS Nova"
    >
      <div className="mb-6">
        <DealCommandStepperSection
          currentStep={10}
          sectionSteps={[9, 10, 11, 15, 16, 17, 18]}
        />
      </div>
      <ReviewQueueClient />
    </AppShell>
  );
}
