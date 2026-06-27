import { AppShell } from "@/components/layout/AppShell";
import { AuditTrailClient } from "@/components/admin/AuditTrailClient";

export default function AuditTrailPage() {
  return (
    <AppShell
      title="Audit Trail"
      subtitle="Organization activity and compliance audit history"
    >
      <AuditTrailClient />
    </AppShell>
  );
}
