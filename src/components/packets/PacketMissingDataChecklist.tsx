import { AlertTriangle } from "lucide-react";
import type { LeadPacketRecord } from "@/lib/types/lead-packet";

export function PacketMissingDataChecklist({ packet }: { packet: LeadPacketRecord }) {
  if (packet.missingRequirements.length === 0) return null;

  return (
    <div className="rounded-xl border border-[rgba(255,180,84,0.35)] bg-[rgba(255,180,84,0.08)] p-5 print:border-amber-300">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--nova-orange)]" />
        <div>
          <h2 className="text-base font-semibold text-[var(--nova-text-primary)]">Missing data checklist</h2>
          <p className="mt-1 text-sm text-[var(--nova-text-secondary)]">
            This packet is incomplete. The items below must be resolved before treating it as review-ready. No records
            were invented to fill gaps.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--nova-text-secondary)]">
            {packet.missingRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
