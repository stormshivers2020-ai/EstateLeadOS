import { isLocalPreviewMode } from "@/lib/config/runtime";
import { isDemoMode } from "@/lib/config/app-mode";
import { isSupabaseMode } from "@/lib/config/runtime";
import { Badge } from "@/components/ui/Badge";

export function ModeBanner() {
  if (isLocalPreviewMode()) return null;

  if (isDemoMode()) {
    return (
      <div className="nova-banner-demo mb-4 rounded-lg px-4 py-2.5 text-sm text-[var(--nova-blue)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Demo Mode</Badge>
          <span>Demo Mode is active. All records shown are fictional sample data.</span>
        </div>
      </div>
    );
  }

  if (isSupabaseMode()) {
    return null;
  }

  return (
    <div className="nova-banner-fresh mb-4 rounded-lg px-4 py-2.5 text-sm text-[var(--nova-green)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Fresh Start</Badge>
        <span>Fresh Start Mode is active. No demo records are loaded.</span>
      </div>
    </div>
  );
}
