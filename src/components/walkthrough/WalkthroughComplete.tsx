"use client";

import Link from "next/link";
import { buildEvidenceSummary } from "@/lib/services/walkthrough/engine";
import type { LeadWalkthroughSession } from "@/lib/types/walkthrough";
import { PacketButton } from "@/components/packets/PacketButton";
import { PartyPopper } from "lucide-react";

export function WalkthroughComplete({ session }: { session: LeadWalkthroughSession }) {
  const summary = buildEvidenceSummary(session);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/40">
        <PartyPopper className="h-10 w-10 text-emerald-400" />
      </div>
      <h1 className="text-3xl font-semibold text-slate-50">First Lead Walkthrough Complete</h1>
      <p className="mt-3 text-slate-400">You guided one lead from source discovery through archive with no drift.</p>

      <dl className="mt-8 space-y-3 rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 text-left text-sm">
        <Row label="Lead name" value={summary.leadName} />
        <Row label="Property" value={summary.propertyAddress} />
        <Row label="Sources" value={String(summary.sourceCount)} />
        <Row label="Evidence items" value={String(summary.evidenceCount)} />
        <Row label="Contact confidence" value={summary.contactConfidence} />
        <Row label="Lead decision" value={summary.leadDecision} />
        <Row label="Packet status" value={summary.packetStatus} />
        <Row label="Next action" value={summary.nextAction.replace(/_/g, " ")} />
        <Row label="Archive" value={summary.archiveLocation} />
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {session.leadId && (
          <>
            <PacketButton leadId={session.leadId} />
            <Link
              href={`/archive?lead=${session.leadId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-5 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Archive
            </Link>
            <Link
              href={`/leads/${session.leadId}?tab=attorney`}
              className="inline-flex items-center justify-center rounded-xl border border-amber-700/50 px-5 py-3 text-sm text-amber-200 hover:bg-amber-950/30"
            >
              Attorney Review
            </Link>
            <Link
              href={`/leads/${session.leadId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-5 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Open lead
            </Link>
          </>
        )}
        <Link
          href={summary.archiveLocation.startsWith("/") ? summary.archiveLocation : "/archive"}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--nova-gold)] px-5 py-3 text-sm font-semibold text-black"
        >
          View archive
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800/80 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-200">{value}</dd>
    </div>
  );
}
