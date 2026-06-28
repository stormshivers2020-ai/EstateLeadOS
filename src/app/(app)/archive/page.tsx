import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ArchiveHubClient } from "@/components/program/ArchiveHubClient";
import { DealCommandStepperSection } from "@/components/deal-command/DealCommandWizardClient";
import { FIRST_ARCHIVE_STEP } from "@/lib/constants/process-steps";

export default function ArchivePage() {
  return (
    <AppShell
      title="Archives"
      subtitle="Initial Review Archive (Step 14) and Final Attorney-Reviewed Archive (Step 19) — EstateLeadOS Powered by SCS Nova"
    >
      <div className="mb-6">
        <DealCommandStepperSection
          currentStep={FIRST_ARCHIVE_STEP}
          sectionSteps={[12, 13, 14]}
        />
      </div>
      <Suspense fallback={<p className="text-sm text-slate-400">Loading archives…</p>}>
        <ArchiveHubClient defaultTab="initial_review" />
      </Suspense>
    </AppShell>
  );
}
