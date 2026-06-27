"use client";

import Link from "next/link";
import { getSessionContext } from "@/lib/config/session";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { isDemoMode } from "@/lib/config/app-mode";
import { Badge } from "@/components/ui/Badge";
import { AutomationButton } from "@/components/automation/AutomationButton";
import { Bell, HelpCircle, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function getModeLabel(): { label: string; variant: "info" | "success" | "warning" } {
  if (isLocalPreviewMode()) return { label: "SCS Nova Production · Local", variant: "success" };
  if (isDemoMode()) return { label: "SCS Nova Production · Demo", variant: "info" };
  return { label: "SCS Nova Production", variant: "success" };
}

export function Header({ title, subtitle }: HeaderProps) {
  const session = getSessionContext();
  const mode = getModeLabel();
  const roleLabel = session.role.replace(/_/g, " ");

  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--nova-border)] bg-[var(--nova-panel)]/80 px-6 py-3 backdrop-blur-md">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--nova-text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--nova-text-secondary)]">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-[var(--nova-border)] bg-black/20 px-3 py-1.5 text-xs lg:flex">
          <span className="text-[var(--nova-text-muted)]">Org</span>
          <span className="max-w-[140px] truncate font-medium text-[var(--nova-text-primary)]">{session.organizationName}</span>
        </div>
        <Badge variant={mode.variant}>{mode.label}</Badge>
        <Badge variant="default" className="capitalize border-[var(--nova-border)] bg-[var(--nova-panel-soft)]">
          {roleLabel}
        </Badge>
        <Badge variant="success">Nova Online</Badge>
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
