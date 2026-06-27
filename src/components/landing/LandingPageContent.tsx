import Link from "next/link";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { NovaLogo } from "@/components/brand/NovaLogo";
import { ArrowRight, Shield, FileText, Users, Calculator, Search, ClipboardList, Sparkles } from "lucide-react";

const PILLARS = [
  { title: "Built for serious acquisition teams", desc: "A nationwide command system for inherited-property intelligence — not a generic CRM." },
  { title: "Nationwide lead intelligence", desc: "Probate, estate-transfer, inherited-property, and family-transfer signal workflows." },
  { title: "Permission-aware data sourcing", desc: "Nova Source Guard tracks approved sources, CSV fallback, and manual verification." },
  { title: "State Deal Kits", desc: "State-specific equipment, documents, and workflow readiness." },
  { title: "Compliance-aware workflow", desc: "Nova Compliance Layer — acknowledgements, blockers, and audit trail. Not legal advice." },
  { title: "Respectful outreach CRM", desc: "Safety-checked templates, DNC controls, and communication logs." },
  { title: "Document packet system", desc: "Nova Document Room — lead packets, templates, and attorney review queue." },
  { title: "Deal calculator", desc: "Estimated offer ranges and deal potential — user-entered assumptions only." },
  { title: "Buyer matching", desc: "Organize buy boxes, proof-of-funds status, and match opportunities responsibly." },
  { title: "Assignment tracking", desc: "Nova Assignment Command — contract workflow through recorded outcomes." },
  { title: "SCS Nova Admin Control", desc: "Platform governance, market licenses, white-label, and system health." },
] as const;

const MODULES = [
  { title: "Lead Intelligence", desc: "Approved public-record workflows and CSV import fallback.", icon: Search },
  { title: "State Deal Kits", desc: "State-specific workflows with required equipment and document checklists.", icon: FileText },
  { title: "Compliance Layer", desc: "Rules engine, acknowledgements, workflow blockers, and audit trail.", icon: Shield },
  { title: "Document Room", desc: "Template builder, document generation, and lead-specific packets.", icon: FileText },
  { title: "Outreach CRM", desc: "Respectful outreach with safety guard and DNC reminders.", icon: Users },
  { title: "Deal Calculator", desc: "Estimated offer ranges — not guaranteed profit.", icon: Calculator },
  { title: "Buyer Network", desc: "Buyer matching and disposition organization.", icon: Users },
  { title: "Assignment Tracker", desc: "Assignment and closing workflow with compliance blockers.", icon: ClipboardList },
  { title: "SCS Nova Control Layer", desc: "Platform licensing, market licenses, and system health.", icon: Shield },
] as const;

export function LandingPageContent() {
  return (
    <div className="min-h-screen bg-[var(--nova-bg-primary)] text-[var(--nova-text-primary)]">
      <header className="border-b border-[var(--nova-border)] px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <NovaLogo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]">Sign In</Link>
            <Link href="/platform" className="rounded-lg px-4 py-2 text-sm text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]">Explore Platform</Link>
            <Link href="/signup" className="nova-btn-primary px-4 py-2 text-sm">Request Demo</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-6 py-24 text-center premium-glow">
          <div className="mx-auto max-w-4xl nova-animate-in">
            <p className="nova-label mb-4 text-[var(--nova-gold)]">Nationwide Inherited-Property Intelligence</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              <span className="text-gradient-brand">{APP_NAME}</span>
            </h1>
            <p className="mt-3 text-lg text-[var(--nova-gold-soft)]">
              Powered by <span className="font-semibold">{POWERED_BY}</span>
            </p>
            <p className="mx-auto mt-6 max-w-3xl text-xl text-[var(--nova-text-secondary)]">
              Inherited-property lead intelligence and acquisition workflow software.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[var(--nova-text-muted)]">
              A nationwide SaaS platform for probate, estate-transfer, inherited-property, and family-transfer lead intelligence — with public-record source tracking, CSV import fallback, state deal kits, compliance-aware workflows, respectful outreach tools, document packets, buyer matching, assignment tracking, and SCS Nova admin control.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="nova-btn-primary inline-flex items-center gap-2 px-6 py-3">
                Request Demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="nova-btn-secondary px-6 py-3 font-medium">Explore Platform</Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--nova-border)] bg-[var(--nova-bg-secondary)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <Sparkles className="mx-auto mb-3 h-6 w-6 text-[var(--nova-gold)]" />
              <h2 className="text-2xl font-bold">Built for serious acquisition teams</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[var(--nova-text-secondary)]">
                EstateLeadOS is a real estate acquisition command center — premium, operational, and compliance-aware.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PILLARS.slice(1).map((p) => (
                <div key={p.title} className="nova-panel rounded-xl p-5 transition-all duration-200 hover:border-[var(--nova-gold-muted)]">
                  <h3 className="font-semibold text-[var(--nova-text-primary)]">{p.title}</h3>
                  <p className="mt-2 text-sm text-[var(--nova-text-secondary)]">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((s) => (
              <div key={s.title} className="nova-panel rounded-xl p-6 transition-all duration-200 hover:nova-glow-gold">
                <s.icon className="mb-3 h-6 w-6 text-[var(--nova-gold)]" />
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--nova-text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--nova-border)] px-6 py-16 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold">Ready to command your acquisition operation?</h2>
            <p className="mt-4 text-[var(--nova-text-secondary)]">Contact SCS Nova for enterprise, market license, and white-label options.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="nova-btn-primary px-6 py-3">Request Demo</Link>
              <Link href="/support" className="nova-btn-secondary px-6 py-3">Contact SCS Nova</Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--nova-border)] px-6 py-10">
          <p className="mx-auto max-w-4xl text-center text-xs leading-relaxed text-[var(--nova-text-muted)]">{GLOBAL_DISCLAIMER}</p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
