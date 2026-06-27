"use client";

import Link from "next/link";
import { WORKFLOW_WIZARDS } from "@/lib/constants/wizards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronRight } from "lucide-react";

export function WizardsHub() {
  return (
    <div className="space-y-6">
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
