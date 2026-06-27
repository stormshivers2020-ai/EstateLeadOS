import { AppShell } from "@/components/layout/AppShell";
import { GovernmentPipelineClient } from "@/components/pipeline/GovernmentPipelineClient";

export default function GovernmentPipelinePage() {
  return (
    <AppShell
      title="Government Pipeline"
      subtitle="Maryland county-by-county inherited-property record engine — Powered by SCS Nova"
    >
      <GovernmentPipelineClient />
    </AppShell>
  );
}
