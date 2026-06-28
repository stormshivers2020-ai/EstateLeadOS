import { AppShell } from "@/components/layout/AppShell";
import { GovernmentPipelineClient } from "@/components/pipeline/GovernmentPipelineClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";

export default function GovernmentPipelinePage() {
  return (
    <AppShell
      title="Government Pipeline"
      subtitle="Maryland county-by-county inherited-property record engine — Powered by SCS Nova"
    >
      <div className="mb-6">
        <DealCommandStepperSection currentStep={1} sectionSteps={[1, 2, 3]} />
      </div>
      <GovernmentPipelineClient />
    </AppShell>
  );
}
