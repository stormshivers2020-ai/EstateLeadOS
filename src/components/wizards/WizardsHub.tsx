"use client";

import Link from "next/link";
import { WORKFLOW_WIZARDS } from "@/lib/constants/wizards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronRight, Route } from "lucide-react";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";

export function WizardsHub() {
  return (
    <div className="space-y-6">
      <Link
        href="/deal-command"
        className="group block rounded-xl border border-[var(--nova-gold-muted)] bg-gradient-to-r from-[var(--nova-gold-muted)]/20 to-black/40 p-5 transition-colors hover:border-[var(--nova-gold)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--nova-gold-soft)]">
              {APP_NAME} · Powered by {POWERED_BY}
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-100">
              <Route className="h-5 w-5 text-[var(--nova-gold)]" />
              Deal Command Wizard
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Full 26-step guided process — Step 1 is always first. Current step, next step, blockers, and approvals clearly shown.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--nova-gold)] transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>

      <div className="premium-panel rounded-xl p-5">
        <p className="text-sm text-slate-300">
          Guided wizards walk you through the full inherited-property workflow — from lead intake through research, compliance, outreach, deal analysis, buyer matching, and document packets. Nationwide state setup included.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {WORKFLOW_WIZARDS.map((wizard) => {
          const Icon = wizard.icon;
          return (
            <Link key={wizard.id} href={wizard.href} className="group">
              <Card className="h-full transition-colors hover:border-sky-700/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/50 text-sky-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{wizard.title}</CardTitle>
                        <Badge variant="default" className="mt-1">{wizard.phase}</Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{wizard.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
