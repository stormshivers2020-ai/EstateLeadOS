"use client";

import { buildEvidenceSummary } from "@/lib/services/walkthrough/engine";
import type { LeadWalkthroughSession } from "@/lib/types/walkthrough";
import { FileText, Image, Link2, User, Scale } from "lucide-react";

interface WalkthroughEvidencePanelProps {
  session: LeadWalkthroughSession;
}

export function WalkthroughEvidencePanel({ session }: WalkthroughEvidencePanelProps) {
  const summary = buildEvidenceSummary(session);
  const d = session.stepData;

  return (
    <aside className="space-y-4" aria-label="Collected evidence">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Evidence collected</p>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-xs">
        <p className="font-medium text-slate-200">{summary.leadName}</p>
        <p className="mt-1 text-slate-500">{summary.propertyAddress}</p>
      </div>

      <ul className="space-y-2 text-xs">
        <li className="flex items-center gap-2 text-slate-300">
          <Link2 className="h-3.5 w-3.5 text-sky-400" />
          {summary.sourceCount} source{summary.sourceCount === 1 ? "" : "s"}
        </li>
        <li className="flex items-center gap-2 text-slate-300">
          <FileText className="h-3.5 w-3.5 text-emerald-400" />
          {summary.evidenceCount} evidence item{summary.evidenceCount === 1 ? "" : "s"}
        </li>
        <li className="flex items-center gap-2 text-slate-300">
          <Image className="h-3.5 w-3.5 text-violet-400" />
          {summary.mediaCount} media item{summary.mediaCount === 1 ? "" : "s"}
        </li>
        <li className="flex items-center gap-2 text-slate-300">
          <User className="h-3.5 w-3.5 text-amber-400" />
          {summary.contactCount} contact{summary.contactCount === 1 ? "" : "s"} · {summary.contactConfidence}
        </li>
      </ul>

      {d.death_probate?.verificationStatus && (
        <div className="rounded-lg border border-slate-700/40 px-3 py-2 text-xs">
          <p className="text-slate-500">Death / probate</p>
          <p className="text-slate-200">{d.death_probate.verificationStatus}</p>
        </div>
      )}

      {d.lead_qualification?.decision && (
        <div className="rounded-lg border border-slate-700/40 px-3 py-2 text-xs">
          <p className="text-slate-500">Decision</p>
          <p className="capitalize text-slate-200">{d.lead_qualification.decision}</p>
          <p className="text-slate-500">Score: {d.lead_qualification.score}</p>
        </div>
      )}

      {d.packet_builder?.packetId && (
        <div className="rounded-lg border border-slate-700/40 px-3 py-2 text-xs">
          <p className="text-slate-500">Packet</p>
          <p className="text-slate-200">{d.packet_builder.status}</p>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-600">
        <Scale className="mt-0.5 h-3 w-3 shrink-0" />
        Weak contact info is never shown as confirmed. This panel updates as you complete each step.
      </p>
    </aside>
  );
}
