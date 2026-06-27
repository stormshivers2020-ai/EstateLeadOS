"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScoreBadge, RiskBadge } from "@/components/compliance/ComplianceBadges";
import { DncBadge, PipelineStageBadge } from "@/components/crm/PipelineBadges";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EMPTY_STATES } from "@/lib/constants/microcopy";
import { getLeadTypeName } from "@/lib/constants/lead-types";
import type { LeadTypeId } from "@/lib/types/leads";
import type { CrmPipelineStage } from "@/lib/types/crm";
import { LayoutGrid, List, Shield, Star, Rss, AlertTriangle } from "lucide-react";

type ViewMode = "cards" | "table" | "high_score" | "compliance" | "review";

interface LeadSummary {
  id: string;
  propertyAddress: string;
  ownerName: string;
  county: string;
  state: string;
  leadType: string;
  status: string;
  origin: string;
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  doNotContact?: boolean;
  dataConfidenceScore?: number;
  assignedUserName?: string;
  nextAction?: string;
  updatedAt?: string;
  signalSummary?: string;
  sourceStatus?: string;
}

interface LeadFeedClientProps {
  leads: LeadSummary[];
  isDemo: boolean;
  blockedCount: number;
}

function riskLevel(score: number) {
  return score >= 80 ? "restricted" : score >= 60 ? "elevated" : score >= 40 ? "moderate" : "low";
}

function LeadCard({ lead }: { lead: LeadSummary }) {
  const initials = lead.assignedUserName?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "—";
  const updatedLabel = lead.updatedAt
    ? new Date(lead.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <Card className="transition-all duration-200 hover:border-[rgba(214,168,79,0.25)] hover:shadow-[var(--shadow-gold)]">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link href={`/leads/${lead.id}`} className="text-lg font-semibold tracking-tight text-[var(--nova-text-primary)] hover:text-[var(--nova-gold-soft)]">
              {lead.propertyAddress}
            </Link>
            <p className="mt-1 text-sm text-[var(--nova-text-secondary)]">{lead.ownerName} · {lead.county}, {lead.state}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="info">{getLeadTypeName(lead.leadType as LeadTypeId)}</Badge>
              <PipelineStageBadge stage={lead.status as CrmPipelineStage} />
              <Badge variant="default">Source: {lead.sourceStatus ?? lead.origin.replace(/_/g, " ")}</Badge>
              {lead.dataConfidenceScore !== undefined && (
                <Badge variant={lead.dataConfidenceScore >= 70 ? "success" : "warning"}>
                  Source Confidence {lead.dataConfidenceScore}%
                </Badge>
              )}
              {lead.doNotContact && <DncBadge />}
            </div>
            {lead.signalSummary && (
              <p className="mt-3 text-xs text-[var(--nova-text-muted)]">
                Nova Signal Summary: <span className="text-[var(--nova-text-secondary)]">{lead.signalSummary}</span>
              </p>
            )}
            {lead.nextAction && (
              <p className="mt-2 text-xs text-[var(--nova-text-muted)]">Next action: <span className="text-[var(--nova-text-secondary)]">{lead.nextAction}</span></p>
            )}
            {lead.assignedUserName && (
              <p className="mt-1 text-xs text-[var(--nova-text-muted)]">Assigned: {lead.assignedUserName}{updatedLabel ? ` · Updated ${updatedLabel}` : ""}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--nova-border)] pt-3">
              <Link href={`/leads/${lead.id}`} className="rounded-md border border-[var(--nova-border)] px-2.5 py-1 text-xs text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-gold)] hover:text-[var(--nova-gold-soft)]">Review Lead</Link>
              <Link href={`/wizards/probate-research?leadId=${lead.id}`} className="rounded-md border border-[var(--nova-border)] px-2.5 py-1 text-xs text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-blue)] hover:text-[var(--nova-blue)]">Research Wizard</Link>
              <Link href={`/wizards/compliance?leadId=${lead.id}`} className="rounded-md border border-[var(--nova-border)] px-2.5 py-1 text-xs text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-blue)] hover:text-[var(--nova-blue)]">Compliance Wizard</Link>
              <Link href={`/wizards/document-packet?leadId=${lead.id}`} className="rounded-md border border-[var(--nova-border)] px-2.5 py-1 text-xs text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-blue)] hover:text-[var(--nova-blue)]">Generate Packet</Link>
              <Link href={`/wizards/buyer-match?leadId=${lead.id}`} className="rounded-md border border-[var(--nova-border)] px-2.5 py-1 text-xs text-[var(--nova-text-secondary)] transition-colors hover:border-[var(--nova-blue)] hover:text-[var(--nova-blue)]">Match Buyer</Link>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              <ScoreBadge score={lead.estateLeadScore} label="Estate Score" />
              <ScoreBadge score={lead.dealPotentialScore} label="Deal Potential" />
              <RiskBadge risk={riskLevel(lead.complianceRiskScore)} />
            </div>
            <div className="hidden sm:flex flex-col items-center gap-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--nova-panel-soft)] text-xs font-medium text-[var(--nova-text-secondary)]">{initials}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadFeedClient({ leads, isDemo, blockedCount }: LeadFeedClientProps) {
  const [view, setView] = useState<ViewMode>("cards");

  const filtered = useMemo(() => {
    if (view === "high_score") return leads.filter((l) => l.estateLeadScore >= 75);
    if (view === "compliance") return leads.filter((l) => l.complianceRiskScore >= 60);
    if (view === "review") return leads.filter((l) => (l.dataConfidenceScore ?? 100) < 70);
    return leads;
  }, [leads, view]);

  const views: { id: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: "cards", label: "Card View", icon: LayoutGrid },
    { id: "table", label: "Table View", icon: List },
    { id: "high_score", label: "High Score", icon: Star },
    { id: "compliance", label: "Compliance Risk", icon: Shield },
    { id: "review", label: "Manual Review", icon: AlertTriangle },
  ];

  if (!isDemo && leads.length === 0) {
    return (
      <EmptyState
        icon={Rss}
        title={EMPTY_STATES.leadFeed.title}
        description={EMPTY_STATES.leadFeed.description}
        primaryAction={{ label: EMPTY_STATES.leadFeed.primary, href: "/market-search" }}
        secondaryAction={{ label: EMPTY_STATES.leadFeed.secondary, href: "/market-search" }}
        learnHref={EMPTY_STATES.leadFeed.learn}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Lead Intelligence Feed"
        subtitle="Signal stack, source confidence, and estate scores across licensed markets"
      />

      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v.id ? "border-[rgba(214,168,79,0.4)] bg-[var(--nova-gold-muted)] text-[var(--nova-gold-soft)]" : "border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:border-[var(--nova-border-strong)]"
            }`}
          >
            <v.icon className="h-3.5 w-3.5" />
            {v.label}
          </button>
        ))}
      </div>

      {isDemo && blockedCount > 0 && (
        <p className="text-xs text-slate-500">{blockedCount} lead(s) hidden — outside licensed markets.</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Rss}
          title={EMPTY_STATES.leadFeedNoMatch.title}
          description={EMPTY_STATES.leadFeedNoMatch.description}
          primaryAction={{ label: "Reset View", href: "/lead-feed" }}
          secondaryAction={{ label: "Market Search", href: "/market-search" }}
        />
      ) : view === "table" ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Estate</th>
                  <th className="px-4 py-3">Deal</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-800/80 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-200">{lead.propertyAddress}</td>
                    <td className="px-4 py-3 text-slate-400">{lead.county}, {lead.state}</td>
                    <td className="px-4 py-3">{lead.estateLeadScore}</td>
                    <td className="px-4 py-3">{lead.dealPotentialScore}</td>
                    <td className="px-4 py-3"><PipelineStageBadge stage={lead.status as CrmPipelineStage} /></td>
                    <td className="px-4 py-3"><Link href={`/leads/${lead.id}`} className="text-sky-400 hover:underline">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      )}
    </div>
  );
}
