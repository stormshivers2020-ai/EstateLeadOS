"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const ANALYTICS_NAV = [
  { href: "/analytics", label: "Analytics Center" },
  { href: "/analytics/profit-loss", label: "Profit & Loss" },
  { href: "/analytics/accrued-money", label: "Accrued Money" },
  { href: "/analytics/pipeline", label: "Pipeline" },
  { href: "/analytics/county", label: "County" },
  { href: "/analytics/sources", label: "Sources" },
  { href: "/analytics/packets", label: "Packets & Archive" },
  { href: "/analytics/attorney", label: "Attorney Review" },
  { href: "/analytics/distribution", label: "Buyer Distribution" },
  { href: "/analytics/assignment", label: "Assignment & Payout" },
  { href: "/analytics/reports", label: "Executive Reports" },
];

export function AnalyticsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-700/50 pb-2 scrollbar-none"
      aria-label="Analytics sections"
    >
      {ANALYTICS_NAV.map((item) => {
        const active = pathname === item.href || (item.href !== "/analytics" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm",
              active
                ? "bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)]"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
