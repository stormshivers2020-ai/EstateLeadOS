import type { LeadPacketSourceItem } from "@/lib/types/lead-packet";
import { ExternalLink } from "lucide-react";

export function PacketSourceCitations({ sources }: { sources: LeadPacketSourceItem[] }) {
  if (sources.length === 0) {
    return <p className="text-sm text-[var(--nova-text-muted)]">No source citations on file.</p>;
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <div key={source.id} className="rounded-lg border border-[var(--nova-border)] bg-white/[0.02] p-4">
          <p className="font-medium text-[var(--nova-text-primary)]">{source.title ?? "Untitled source"}</p>
          <p className="text-xs text-[var(--nova-text-muted)]">
            {source.sourceType}
            {source.agency ? ` · ${source.agency}` : ""}
            {source.confidence != null ? ` · confidence ${source.confidence}` : ""}
          </p>
          {source.notes && <p className="mt-2 text-sm text-[var(--nova-text-secondary)]">{source.notes}</p>}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--nova-blue)] hover:underline"
            >
              Open source <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {source.capturedAt && (
            <p className="mt-1 text-[10px] text-[var(--nova-text-muted)]">
              Captured {new Date(source.capturedAt).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
