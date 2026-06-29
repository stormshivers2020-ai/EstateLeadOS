import { PACKET_CONTACT_DISCLAIMER } from "@/lib/types/lead-packet";
import type { LeadPacketContactItem } from "@/lib/types/lead-packet";
import { Badge } from "@/components/ui/Badge";

export function PacketContactSection({
  contacts,
  notFoundReason,
}: {
  contacts: LeadPacketContactItem[];
  notFoundReason: string | null;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--nova-orange)]">{PACKET_CONTACT_DISCLAIMER}</p>
      {notFoundReason && (
        <p className="rounded-lg border border-[var(--nova-border)] px-3 py-2 text-sm text-[var(--nova-text-secondary)]">
          Documented not found: {notFoundReason}
        </p>
      )}
      {contacts.length === 0 ? (
        <p className="text-sm text-[var(--nova-text-muted)]">No contact candidates on file.</p>
      ) : (
        contacts.map((c) => (
          <div key={c.id} className="rounded-lg border border-[var(--nova-border)] p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[var(--nova-text-primary)]">{c.name ?? "Unknown name"}</p>
              <Badge variant="default">{c.role}</Badge>
              <Badge variant={c.confidence === "verified" ? "success" : c.confidence === "likely" ? "info" : "warning"}>
                {c.confidence}
              </Badge>
            </div>
            <dl className="mt-2 grid gap-1 sm:grid-cols-3">
              {c.phone && (
                <div>
                  <dt className="text-xs text-[var(--nova-text-muted)]">Phone</dt>
                  <dd>{c.phone}</dd>
                </div>
              )}
              {c.email && (
                <div>
                  <dt className="text-xs text-[var(--nova-text-muted)]">Email</dt>
                  <dd>{c.email}</dd>
                </div>
              )}
              {c.mailingAddress && (
                <div>
                  <dt className="text-xs text-[var(--nova-text-muted)]">Mailing</dt>
                  <dd>{c.mailingAddress}</dd>
                </div>
              )}
            </dl>
            {c.sourceNotes && <p className="mt-2 text-xs text-[var(--nova-text-muted)]">{c.sourceNotes}</p>}
          </div>
        ))
      )}
    </div>
  );
}
