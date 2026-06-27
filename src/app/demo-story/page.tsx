import Link from "next/link";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Badge } from "@/components/ui/Badge";
import { PLATFORM_VALUE } from "@/lib/constants/microcopy";

const DEMO_STEPS = [
  { step: 1, title: "Dashboard Overview", href: "/dashboard", desc: "Executive summary of lead intelligence, compliance, and pipeline" },
  { step: 2, title: "High-Score Lead", href: "/lead-feed", desc: "Review inherited-property intelligence in the lead feed" },
  { step: 3, title: "Lead Detail Dossier", href: "/leads/lead-demo-1", desc: "Signal explanation, source evidence, and score breakdown" },
  { step: 4, title: "State Deal Kit", href: "/state-deal-kits", desc: "Equipment and document checklists by state" },
  { step: 5, title: "Compliance Blocker", href: "/compliance", desc: "Acknowledgement and workflow blockers" },
  { step: 6, title: "Document Packet", href: "/documents", desc: "Lead-specific document readiness" },
  { step: 7, title: "Respectful Outreach", href: "/outreach", desc: "Communication logs with safety guard" },
  { step: 8, title: "Deal Calculator", href: "/deal-calculator", desc: "Estimated ranges — not guaranteed profit" },
  { step: 9, title: "Buyer Match", href: "/buyer-network", desc: "Disposition command center" },
  { step: 10, title: "Assignment Tracker", href: "/assignments", desc: "Assignment and closing workflow" },
  { step: 11, title: "Executive Reports", href: "/reports", desc: "Pipeline and compliance metrics" },
  { step: 12, title: "SCS Nova Admin", href: "/admin", desc: "Master platform control layer" },
] as const;

export default function DemoStoryPage() {
  return (
    <PublicPageLayout title="Demo Story Mode">
      <Badge variant="info" className="mb-4">Fictional sample data — investor presentation path</Badge>
      <p className="mb-8 text-sm leading-relaxed text-slate-400">{PLATFORM_VALUE}</p>
      <ol className="space-y-3">
        {DEMO_STEPS.map((s) => (
          <li key={s.step} className="premium-panel rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-sky-400">Step {s.step}</p>
                <h2 className="font-semibold text-slate-100">{s.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
              </div>
              <Link href={s.href} className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500">
                Open
              </Link>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-slate-500">Requires NEXT_PUBLIC_DEMO_MODE=true and authenticated session.</p>
    </PublicPageLayout>
  );
}
