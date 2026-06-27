"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MAIN_NAVIGATION, NAV_SECTIONS } from "@/lib/constants/navigation";
import { ScsNovaSidebarFooter } from "@/components/brand/ScsNovaBrand";
import { NovaLogo } from "@/components/brand/NovaLogo";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

interface SidebarProps {
  isAdmin?: boolean;
  mobileOpen?: boolean;
  desktopCollapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  isAdmin = false,
  mobileOpen = false,
  desktopCollapsed = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = MAIN_NAVIGATION.filter((item) => !item.adminOnly || isAdmin);
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    onNavigate?.();
  }, [pathname, onNavigate]);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-[var(--nova-border)] bg-[var(--nova-bg-secondary)] transition-[width,transform] duration-200 ease-out",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[min(18rem,92vw)] max-md:shadow-2xl",
        mobileOpen
          ? "max-md:translate-x-0 max-md:pointer-events-auto"
          : "max-md:pointer-events-none max-md:-translate-x-full",
        "md:relative md:z-auto md:translate-x-0 md:pointer-events-auto",
        desktopCollapsed ? "md:w-[4.5rem]" : "md:w-64"
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex items-center border-b border-[var(--nova-border)] py-4",
          desktopCollapsed ? "justify-between px-3 md:justify-center md:px-2" : "justify-between px-4"
        )}
      >
        <Link href="/dashboard" onClick={onNavigate} className="min-w-0">
          <span className="md:hidden">
            <NovaLogo size="sm" />
          </span>
          <span className="hidden md:inline-flex">
            <NovaLogo size="sm" iconOnly={desktopCollapsed} />
          </span>
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--nova-text-secondary)] hover:bg-white/[0.04] md:hidden"
          aria-label="Close menu"
          onClick={onNavigate}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = navItems.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className="mb-5">
              {!desktopCollapsed && (
                <p className="nova-label mb-2 px-3">{section}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={desktopCollapsed ? item.label : item.description}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg py-2.5 text-sm transition-all duration-200",
                          desktopCollapsed ? "md:justify-center md:px-2" : "px-3",
                          isActive
                            ? "nova-nav-active font-medium"
                            : "text-[var(--nova-text-secondary)] hover:bg-white/[0.03] hover:text-[var(--nova-text-primary)]"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[var(--nova-gold)]")} />
                        <span className={cn("truncate", desktopCollapsed && "md:sr-only")}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-[var(--nova-border)] px-4 py-4 safe-area-pb",
          desktopCollapsed && "md:hidden"
        )}
      >
        <ScsNovaSidebarFooter />
      </div>
    </aside>
  );
}
