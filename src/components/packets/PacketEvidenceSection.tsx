import type { LeadPacketProbateEvidence } from "@/lib/types/lead-packet";

export function PacketEvidenceSection({ evidence }: { evidence: LeadPacketProbateEvidence }) {
  const fields = [
    ["Probate record", evidence.probateRecord],
    ["Death record", evidence.deathRecord],
    ["Obituary record", evidence.obituaryRecord],
    ["Register of Wills source", evidence.registerOfWillsSource],
    ["Estate filing", evidence.estateFiling],
    ["Court / probate reference", evidence.courtReference],
    ["Verification status", evidence.verificationStatus],
  ] as const;

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[var(--nova-text-muted)]">{label}</dt>
            <dd className="text-[var(--nova-text-secondary)]">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {evidence.unavailableReason && (
        <p className="rounded-lg border border-[rgba(255,180,84,0.3)] bg-[rgba(255,180,84,0.06)] px-3 py-2 text-xs text-[var(--nova-orange)]">
          Unavailable: {evidence.unavailableReason}
        </p>
      )}
      {evidence.citations.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--nova-text-muted)]">Citations</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--nova-text-secondary)]">
            {evidence.citations.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {evidence.notes && <p className="text-[var(--nova-text-secondary)]">{evidence.notes}</p>}
    </div>
  );
}
