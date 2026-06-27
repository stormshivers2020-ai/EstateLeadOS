import { AnalyticsNav } from "@/components/analytics/AnalyticsNav";
import { ScsNovaBrand } from "@/components/brand/ScsNovaBrand";
import type { ReactNode } from "react";

interface AnalyticsPageShellProps {
  children: ReactNode;
}

export function AnalyticsPageShell({ children }: AnalyticsPageShellProps) {
  return (
    <div className="space-y-6 premium-glow">
      <AnalyticsNav />
      {children}
      <div className="border-t border-slate-800/60 pt-6">
        <ScsNovaBrand variant="command" />
      </div>
    </div>
  );
}
