import type { EvidenceSource, ProofChainStep } from "@/lib/types/verification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { GOVERNMENT_PROOF_DISCLAIMER } from "@/lib/constants/required-packet-items";
import { GitBranch } from "lucide-react";

interface ProofChainTimelineProps {
  steps: ProofChainStep[];
  evidenceSources: EvidenceSource[];
}

const STATUS_COLORS: Record<ProofChainStep["status"], string> = {
  complete: "border-emerald-600/50 bg-emerald-900/10",
  partial: "border-amber-600/50 bg-amber-900/10",
  missing: "border-slate-700/40 bg-slate-900/20",
  pending_approval: "border-sky-600/50 bg-sky-900/10",
};

export function ProofChainTimeline({ steps, evidenceSources }: ProofChainTimelineProps) {
  const evidenceById = new Map(evidenceSources.map((e) => [e.id, e]));
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <Card className="border-sky-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4 text-sky-400" />
          Government Proof Chain Timeline
        </CardTitle>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {APP_NAME} · Powered by {POWERED_BY}
        </p>
        <p className="text-xs text-slate-500">{GOVERNMENT_PROOF_DISCLAIMER}</p>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-0 border-l border-slate-700 pl-4 sm:pl-6">
          {sorted.map((step) => (
            <li key={step.id} className="relative pb-5 last:pb-0 sm:pb-6">
              <span
                className={`absolute -left-[0.85rem] top-1.5 flex h-3 w-3 rounded-full border-2 bg-slate-900 sm:-left-[1.35rem] ${
                  step.status === "complete"
                    ? "border-emerald-500"
                    : step.status === "pending_approval"
                      ? "border-sky-500"
                      : step.status === "partial"
                        ? "border-amber-500"
                        : "border-slate-600"
                }`}
              />
              <div className={`rounded-lg border p-3 sm:p-3 ${STATUS_COLORS[step.status]}`}>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <span className="text-xs font-mono text-slate-500">Step {step.stepNumber}</span>
                  <span className="font-medium text-slate-200">{step.title}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="default">{step.status.replace(/_/g, " ")}</Badge>
                    {step.confidenceScore != null && <Badge variant="info">{step.confidenceScore}%</Badge>}
                    {step.kind === "contact_candidate" && (
                      <Badge variant="warning">Separate from verified proof</Badge>
                    )}
                    {step.kind === "manual_review" && (
                      <Badge variant="info">Not legal approval</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-1 break-words text-sm text-slate-300">{step.description}</p>
                {step.evidenceIds.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-400">
                    {step.evidenceIds.map((eid) => {
                      const ev = evidenceById.get(eid);
                      if (!ev) return null;
                      return (
                        <li key={eid}>
                          <a href={`#evidence-${ev.id}`} className="text-sky-400 hover:underline">
                            [{ev.citationNumber}] {ev.sourceName} — {ev.citationLabel}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
