"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PacketPreview } from "@/components/packets/PacketPreview";
import { PacketButton } from "@/components/packets/PacketButton";
import type { LeadPacketRecord } from "@/lib/types/lead-packet";

export function PacketPageClient({ leadId, leadAddress }: { leadId: string; leadAddress?: string }) {
  const searchParams = useSearchParams();
  const rebuildOnLoad = searchParams.get("rebuild") === "1";
  const [packet, setPacket] = useState<LeadPacketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(forceRebuild = false) {
    setLoading(true);
    setError(null);
    try {
      if (forceRebuild) {
        const buildRes = await fetch(`/api/packets/${leadId}/build`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rebuild: true }),
        });
        const buildData = await buildRes.json();
        if (!buildRes.ok) {
          setError(buildData.error ?? "Could not rebuild packet.");
          return;
        }
        setPacket(buildData.packet ?? null);
        return;
      }

      const res = await fetch(`/api/packets/${leadId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load packet.");
        return;
      }
      setPacket(data.packet ?? null);
    } catch {
      setError("Could not load packet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(rebuildOnLoad);
  }, [leadId, rebuildOnLoad]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-sm text-[var(--nova-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading packet…
      </div>
    );
  }

  if (!packet) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <p className="text-sm text-[var(--nova-text-secondary)]">No packet has been built for this lead yet.</p>
        <PacketButton leadId={leadId} />
        <Link href={`/leads/${leadId}`} className="block text-xs text-[var(--nova-blue)] hover:underline">
          Back to lead
        </Link>
        {error && <p className="text-xs text-[var(--nova-red)]">{error}</p>}
      </div>
    );
  }

  return <PacketPreview packet={packet} leadAddress={leadAddress} />;
}
