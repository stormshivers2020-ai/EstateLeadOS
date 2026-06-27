import { LocalPreviewBanner } from "@/components/platform/LocalPreviewBanner";
import { ModeBanner } from "@/components/platform/ModeBanner";
import { PlatformNotices } from "@/components/platform/PlatformNotices";
import { SessionGuard } from "@/components/platform/SessionGuard";
import { AutomationShell } from "@/components/automation/AutomationShell";
import { DisclaimerFooter } from "./DisclaimerFooter";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isAdmin?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  isAdmin = false,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--nova-bg-primary)]">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AutomationShell>
          <Header title={title} subtitle={subtitle} />
          <main className="nova-animate-in flex-1 overflow-y-auto p-6 premium-glow">
            <LocalPreviewBanner />
            <ModeBanner />
            <PlatformNotices />
            <SessionGuard>{children}</SessionGuard>
          </main>
          <DisclaimerFooter />
        </AutomationShell>
      </div>
    </div>
  );
}
