"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveWalkthroughSession } from "@/lib/services/walkthrough/session-store";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

export function WalkthroughNavItem({
  href,
  icon: Icon,
  isActive,
  desktopCollapsed,
  description,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  desktopCollapsed: boolean;
  description: string;
  onNavigate?: () => void;
}) {
  const [label, setLabel] = useState("First Lead Walkthrough");

  useEffect(() => {
    const active = getActiveWalkthroughSession();
    if (active && active.status !== "complete" && active.currentStep !== "complete") {
      setLabel("Resume First Lead Walkthrough");
    }
  }, []);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={desktopCollapsed ? label : description}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg py-2.5 text-sm transition-all duration-200",
        desktopCollapsed ? "md:justify-center md:px-2" : "px-3",
        isActive
          ? "nova-nav-active font-medium"
          : "text-[var(--nova-text-secondary)] hover:bg-white/[0.03] hover:text-[var(--nova-text-primary)]"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[var(--nova-gold)]")} />
      <span className={cn("truncate", desktopCollapsed && "md:sr-only")}>{label}</span>
    </Link>
  );
}
