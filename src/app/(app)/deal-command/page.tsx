import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DealCommandWizardClient } from "@/components/deal-command/DealCommandWizardClient";

export default function DealCommandPage() {
  return (
    <AppShell
      title="Build Your First Packet"
      subtitle="Easy steps — one page at a time · Powered by SCS Nova"
    >
      <Suspense fallback={<p className="text-sm text-slate-400">Loading Deal Command Wizard…</p>}>
        <DealCommandWizardClient />
      </Suspense>
    </AppShell>
  );
}
