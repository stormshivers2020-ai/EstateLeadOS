"use client";

import { useCallback, useEffect, useState } from "react";
import { LocalPreviewBanner } from "@/components/platform/LocalPreviewBanner";
import { ModeBanner } from "@/components/platform/ModeBanner";
import { PlatformNotices } from "@/components/platform/PlatformNotices";
import { SessionGuard } from "@/components/platform/SessionGuard";
import { AutomationShell } from "@/components/automation/AutomationShell";
import { DisclaimerFooter } from "./DisclaimerFooter";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const DESKTOP_NAV_KEY = "estateleados-sidebar-collapsed";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);

  useEffect(() => {
    try {
      setDesktopNavCollapsed(localStorage.getItem(DESKTOP_NAV_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);

  const toggleDesktopNav = useCallback(() => {
    setDesktopNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DESKTOP_NAV_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="app-shell flex h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[var(--nova-bg-primary)]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeMobileNav}
        />
      )}

      <Sidebar
        isAdmin={isAdmin}
        mobileOpen={mobileNavOpen}
        desktopCollapsed={desktopNavCollapsed}
        onNavigate={closeMobileNav}
      />

      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <AutomationShell>
          <Header
            title={title}
            subtitle={subtitle}
            onMenuClick={openMobileNav}
            desktopNavCollapsed={desktopNavCollapsed}
            onDesktopNavToggle={toggleDesktopNav}
          />
          <main className="nova-animate-in w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 premium-glow safe-area-pb">
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
