"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileStack } from "lucide-react";

interface PacketButtonProps {
  leadId: string;
  rebuild?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}

export function PacketButton({ leadId, rebuild = false, variant = "primary", className = "" }: PacketButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      if (!rebuild) {
        const existing = await fetch(`/api/packets/${leadId}`, { credentials: "include" });
        const existingData = await existing.json();
        if (existing.ok && existingData.packet) {
          router.push(`/packets/${leadId}`);
          return;
        }
      }

      const res = await fetch(`/api/packets/${leadId}/build`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebuild }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not build packet.");
        return;
      }
      router.push(`/packets/${leadId}`);
    } catch {
      setError("Could not build packet.");
    } finally {
      setLoading(false);
    }
  }

  const base =
    variant === "primary"
      ? "nova-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
      : "inline-flex items-center gap-1.5 rounded-lg border border-[var(--nova-border)] px-4 py-2 text-sm text-[var(--nova-text-secondary)] hover:border-[var(--nova-gold)]";

  return (
    <div className={className}>
      <button type="button" disabled={loading} onClick={handleClick} className={`${base} disabled:opacity-50`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileStack className="h-4 w-4" />}
        Packet
      </button>
      {error && <p className="mt-1 text-xs text-[var(--nova-red)]">{error}</p>}
    </div>
  );
}
