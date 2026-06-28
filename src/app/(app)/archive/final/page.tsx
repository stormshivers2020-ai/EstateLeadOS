import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ArchiveHubClient } from "@/components/program/ArchiveHubClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";
import { FINAL_ARCHIVE_STEP, FINAL_OUTCOME_STEP } from "@/lib/constants/process-steps";

export default function FinalArchivePage() {
  return (
    <AppShell
      title="Final Attorney-Reviewed Archive"
      subtitle="Step 19 — attorney-reviewed and signed files — EstateLeadOS Powered by SCS Nova"
    >
      <div className="mb-6">
        <DealCommandStepperSection
          currentStep={FINAL_ARCHIVE_STEP}
          sectionSteps={[FINAL_ARCHIVE_STEP, FINAL_OUTCOME_STEP, 18, 19, 26]}
        />
      </div>
      <Suspense fallback={<p className="text-sm text-slate-400">Loading final archive…</p>}>
        <ArchiveHubClient defaultTab="final_attorney_reviewed" />
      </Suspense>
    </AppShell>
  );
}
