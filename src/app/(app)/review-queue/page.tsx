import { AppShell } from "@/components/layout/AppShell";
import { ReviewQueueClient } from "@/components/program/ReviewQueueClient";

export default function ReviewQueuePage() {
  return (
    <AppShell
      title="Review Queue"
      subtitle="Manual review, packets, compliance blockers, and assignment-readiness — Powered by SCS Nova"
    >
      <ReviewQueueClient />
    </AppShell>
  );
}
