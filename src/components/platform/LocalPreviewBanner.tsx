import { isLocalPreviewMode } from "@/lib/config/runtime";
import { Badge } from "@/components/ui/Badge";

export function LocalPreviewBanner() {
  if (!isLocalPreviewMode()) return null;

  return (
    <div className="nova-banner-local mb-4 rounded-lg px-4 py-2.5 text-sm text-[var(--nova-cyan)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info" className="border-[var(--nova-cyan)]/30 bg-[var(--nova-cyan)]/10 text-[var(--nova-cyan)]">
          Local Preview Mode
        </Badge>
        <span>
          Local Preview Mode is active. Production services are not connected. You are viewing EstateLeadOS locally before Supabase, storage, and live data providers are connected.
        </span>
      </div>
    </div>
  );
}
