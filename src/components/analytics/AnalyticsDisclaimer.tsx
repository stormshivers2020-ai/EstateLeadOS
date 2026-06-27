"use client";

import { ANALYTICS_DISCLAIMER } from "@/lib/types/analytics";
import { AlertTriangle } from "lucide-react";

export function AnalyticsDisclaimer({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-[var(--nova-gold-muted)] bg-[var(--nova-gold-muted)]/30 ${compact ? "p-3" : "p-4"}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nova-gold)]" />
      <p className={`leading-relaxed text-[var(--nova-text-secondary)] ${compact ? "text-xs" : "text-sm"}`}>
        {ANALYTICS_DISCLAIMER}
      </p>
    </div>
  );
}
