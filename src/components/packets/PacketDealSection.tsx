import type { LeadPacketDealEstimate } from "@/lib/types/lead-packet";

function fmt(n: number | null): string {
  return n == null ? "—" : `$${n.toLocaleString()}`;
}

export function PacketDealSection({ estimate }: { estimate: LeadPacketDealEstimate | null }) {
  if (!estimate) {
    return <p className="text-sm text-[var(--nova-text-muted)]">No deal estimate on file. Run the deal calculator or walkthrough deal step.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">ARV range</dt>
          <dd>{fmt(estimate.arvLow)} – {fmt(estimate.arvHigh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Offer range</dt>
          <dd>{fmt(estimate.offerLow)} – {fmt(estimate.offerHigh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Assignment fee target</dt>
          <dd>{fmt(estimate.assignmentFeeTarget)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--nova-text-muted)]">Source</dt>
          <dd className="capitalize">{estimate.source.replace(/_/g, " ")}</dd>
        </div>
      </dl>
      {estimate.repairAssumptions && (
        <p><span className="text-xs text-[var(--nova-text-muted)]">Repairs: </span>{estimate.repairAssumptions}</p>
      )}
      {estimate.buyerDemandNotes && (
        <p><span className="text-xs text-[var(--nova-text-muted)]">Buyer demand: </span>{estimate.buyerDemandNotes}</p>
      )}
      {estimate.riskNotes && (
        <p><span className="text-xs text-[var(--nova-text-muted)]">Risk: </span>{estimate.riskNotes}</p>
      )}
      <p className="text-xs text-[var(--nova-text-muted)] italic">{estimate.disclaimer}</p>
    </div>
  );
}
