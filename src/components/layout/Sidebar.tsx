"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION, NAV_SECTIONS } from "@/lib/constants/navigation";
import { ScsNovaSidebarFooter } from "@/components/brand/ScsNovaBrand";
import { NovaLogo } from "@/components/brand/NovaLogo";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const navItems = MAIN_NAVIGATION.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--nova-border)] bg-[var(--nova-bg-secondary)]">
      <div className="border-b border-[var(--nova-border)] px-4 py-5">
        <Link href="/dashboard">
          <NovaLogo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = navItems.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section} className="mb-5">
              <p className="nova-label mb-2 px-3">{section}</p>
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                          isActive
                            ? "nova-nav-active font-medium"
                            : "text-[var(--nova-text-secondary)] hover:bg-white/[0.03] hover:text-[var(--nova-text-primary)]"
                        )}
                        title={item.description}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[var(--nova-gold)]")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--nova-border)] px-4 py-4">
        <ScsNovaSidebarFooter />
      </div>
    </aside>
  );
}
