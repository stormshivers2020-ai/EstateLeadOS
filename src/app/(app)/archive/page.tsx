import { AppShell } from "@/components/layout/AppShell";
import { ArchiveClient } from "@/components/program/ArchiveClient";

export default function ArchivePage() {
  return (
    <AppShell
      title="Archive"
      subtitle="Lead packet archive — printable, versioned, review-ready — Powered by SCS Nova"
    >
      <ArchiveClient />
    </AppShell>
  );
}
