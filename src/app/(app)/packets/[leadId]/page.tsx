import { AppShell } from "@/components/layout/AppShell";
import { PacketPageClient } from "@/components/packets/PacketPageClient";
import { getFullLeadById } from "@/lib/services/crm/server";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface PacketPageProps {
  params: Promise<{ leadId: string }>;
}

export default async function PacketPage({ params }: PacketPageProps) {
  const { leadId } = await params;
  const lead = await getFullLeadById(leadId);

  return (
    <AppShell
      title="Lead Packet"
      subtitle={lead?.propertyAddress ?? `Lead ${leadId}`}
    >
      <Suspense
        fallback={
          <div className="flex items-center gap-2 py-20 text-sm text-[var(--nova-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading packet…
          </div>
        }
      >
        <PacketPageClient leadId={leadId} leadAddress={lead?.propertyAddress} />
      </Suspense>
    </AppShell>
  );
}
