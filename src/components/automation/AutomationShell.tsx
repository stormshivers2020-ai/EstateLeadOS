"use client";

import { AutomationProvider } from "./AutomationContext";
import { AutomationPanel } from "./AutomationPanel";

export function AutomationShell({ children }: { children: React.ReactNode }) {
  return (
    <AutomationProvider>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <AutomationPanel />
    </AutomationProvider>
  );
}
