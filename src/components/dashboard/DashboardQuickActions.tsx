import Link from "next/link";
import { canAccessAdminConsole } from "@/lib/engines/permission-guard";
import { getSessionContext } from "@/lib/config/session";
import {
  BarChart3, Calculator, ClipboardList, FolderOpen, MessageSquare,
  Rss, Search, Shield, ShieldCheck, Upload, Users,
} from "lucide-react";

const ACTIONS = [
  { href: "/market-search", label: "Market Search", icon: Search },
  { href: "/market-search?import=csv", label: "Import CSV", icon: Upload },
  { href: "/lead-feed", label: "Lead Feed", icon: Rss },
  { href: "/compliance", label: "Compliance", icon: Shield },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/outreach", label: "Outreach CRM", icon: MessageSquare },
  { href: "/deal-calculator", label: "Deal Calculator", icon: Calculator },
  { href: "/buyer-network", label: "Buyer Network", icon: Users },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function DashboardQuickActions() {
  const session = getSessionContext();
  const showAdmin = canAccessAdminConsole(session.role);

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:border-sky-600/50 hover:text-sky-300"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Link>
      ))}
      {showAdmin && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg border border-sky-700/50 bg-sky-900/30 px-3 py-2 text-sm text-sky-300 hover:border-sky-600"
        >
          <ShieldCheck className="h-4 w-4" />
          SCS Nova Admin
        </Link>
      )}
    </div>
  );
}
