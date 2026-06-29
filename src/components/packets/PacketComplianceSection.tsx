import type { LeadPacketCompliance } from "@/lib/types/lead-packet";

export function PacketComplianceSection({ compliance }: { compliance: LeadPacketCompliance }) {
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Compliance status</dt>
          <dd>{compliance.complianceStatus ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Attorney review</dt>
          <dd className="capitalize">{compliance.attorneyReviewStatus?.replace(/_/g, " ") ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Outreach allowed</dt>
          <dd className="uppercase">{compliance.outreachAllowed}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Next review step</dt>
          <dd>{compliance.nextRequiredReviewStep ?? "—"}</dd>
        </div>
      </dl>
      {compliance.notes && <p className="text-[var(--nova-text-secondary)]">{compliance.notes}</p>}
      {compliance.legalWarnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--nova-orange)]">
          {compliance.legalWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
