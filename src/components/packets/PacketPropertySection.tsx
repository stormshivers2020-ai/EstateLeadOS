import type { LeadPacketPropertyEvidence, LeadPacketMediaItem } from "@/lib/types/lead-packet";

export function PacketPropertySection({
  property,
  media,
}: {
  property: LeadPacketPropertyEvidence;
  media: LeadPacketMediaItem[];
}) {
  const fields = [
    ["Property address", property.propertyAddress],
    ["Parcel ID", property.parcelId],
    ["Deed source", property.deedSource],
    ["Tax record source", property.taxRecordSource],
    ["SDAT / GIS source", property.sdatGisSource],
    ["Land record source", property.landRecordSource],
    ["Property confidence", property.propertyConfidenceScore?.toString() ?? null],
  ] as const;

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[var(--nova-text-muted)]">{label}</dt>
            <dd className="text-[var(--nova-text-secondary)]">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {property.ownerConnectionNotes && (
        <p className="text-[var(--nova-text-secondary)]">
          <span className="text-xs text-[var(--nova-text-muted)]">Owner connection: </span>
          {property.ownerConnectionNotes}
        </p>
      )}
      {property.unavailableReason && (
        <p className="rounded-lg border border-[rgba(255,180,84,0.3)] px-3 py-2 text-xs text-[var(--nova-orange)]">
          Property evidence gap: {property.unavailableReason}
        </p>
      )}
      {media.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {media.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--nova-border)] p-3">
              <p className="text-xs font-medium text-[var(--nova-text-primary)]">{item.caption ?? item.mediaType}</p>
              {item.mediaUrl && !item.unavailableReason ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.mediaUrl} alt={item.caption ?? "Property media"} className="mt-2 max-h-40 w-full rounded object-cover" />
              ) : (
                <p className="mt-2 text-xs text-[var(--nova-text-muted)]">
                  {item.unavailableReason ?? "No image URL on file"}
                </p>
              )}
              {item.source && <p className="mt-1 text-[10px] text-[var(--nova-text-muted)]">Source: {item.source}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
