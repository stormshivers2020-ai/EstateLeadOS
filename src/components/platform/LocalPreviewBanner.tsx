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
          Live mode — no demo records. Add leads via Market Search or automation; data persists in this browser until you clear it.
        </span>
      </div>
    </div>
  );
}
