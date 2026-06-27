"use client";

import Link from "next/link";
import { getSessionContext } from "@/lib/config/session";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { isDemoMode } from "@/lib/config/app-mode";
import { Badge } from "@/components/ui/Badge";
import { AutomationButton } from "@/components/automation/AutomationButton";
import { Bell, HelpCircle, Menu, PanelLeft, PanelLeftClose, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  desktopNavCollapsed?: boolean;
  onDesktopNavToggle?: () => void;
}

function getModeLabel(): { label: string; variant: "info" | "success" | "warning" } {
  if (isLocalPreviewMode()) return { label: "SCS Nova Production · Local", variant: "success" };
  if (isDemoMode()) return { label: "SCS Nova Production · Demo", variant: "info" };
  return { label: "SCS Nova Production", variant: "success" };
}

export function Header({
  title,
  subtitle,
  onMenuClick,
  desktopNavCollapsed = false,
  onDesktopNavToggle,
}: HeaderProps) {
  const session = getSessionContext();
  const mode = getModeLabel();
  const roleLabel = session.role.replace(/_/g, " ");

  return (
    <header className="flex min-h-14 shrink-0 flex-col gap-2 border-b border-[var(--nova-border)] bg-[var(--nova-panel)]/80 px-4 py-3 backdrop-blur-md sm:min-h-16 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--nova-text-primary)] md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {onDesktopNavToggle && (
          <button
            type="button"
            onClick={onDesktopNavToggle}
            className="touch-target hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--nova-text-primary)] md:flex"
            aria-label={desktopNavCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {desktopNavCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-[var(--nova-text-primary)] sm:text-lg">{title}</h2>
          {subtitle && <p className="line-clamp-2 text-xs text-[var(--nova-text-secondary)] sm:line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2 md:ml-auto md:w-auto md:flex-nowrap">
        <div className="hidden items-center gap-2 rounded-lg border border-[var(--nova-border)] bg-black/20 px-3 py-1.5 text-xs lg:flex">
          <span className="text-[var(--nova-text-muted)]">Org</span>
          <span className="max-w-[140px] truncate font-medium text-[var(--nova-text-primary)]">{session.organizationName}</span>
        </div>
        <Badge variant={mode.variant} className="max-sm:hidden sm:inline-flex">{mode.label}</Badge>
        <Badge variant="default" className="max-sm:hidden capitalize border-[var(--nova-border)] bg-[var(--nova-panel-soft)] sm:inline-flex">
          {roleLabel}
        </Badge>
        <Badge variant="success" className="hidden sm:inline-flex">Nova Online</Badge>
        <AutomationButton />

        <div className="ml-1 flex items-center gap-1 border-l border-[var(--nova-border)] pl-2">
          <Link
            href="/support"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--nova-gold-soft)]"
            aria-label="Help and Support"
          >
            <HelpCircle className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--nova-text-primary)]"
            aria-label="Search (coming soon)"
            title="Global search — coming soon"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--nova-text-primary)]"
            aria-label="Notifications (coming soon)"
            title="Notifications — coming soon"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
