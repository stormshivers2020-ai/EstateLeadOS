"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadPacketRecord } from "@/lib/types/lead-packet";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { Badge } from "@/components/ui/Badge";
import { PacketMissingDataChecklist } from "./PacketMissingDataChecklist";
import { PacketSourceCitations } from "./PacketSourceCitations";
import { PacketEvidenceSection } from "./PacketEvidenceSection";
import { PacketPropertySection } from "./PacketPropertySection";
import { PacketContactSection } from "./PacketContactSection";
import { PacketDealSection } from "./PacketDealSection";
import { PacketComplianceSection } from "./PacketComplianceSection";
import { Loader2 } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="packet-section break-inside-avoid rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg-primary)] p-5">
      <h2 className="text-base font-semibold text-[var(--nova-text-primary)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PacketPreview({ packet, leadAddress }: { packet: LeadPacketRecord; leadAddress?: string }) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const content = packet.packetJson;

  async function rebuild() {
    setActing("rebuild");
    setMessage(null);
    try {
      const res = await fetch(`/api/packets/${packet.leadId}/build`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebuild: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Rebuild failed");
        return;
      }
      router.refresh();
    } finally {
      setActing(null);
    }
  }

  async function archivePacket() {
    setActing("archive");
    try {
      const res = await fetch(`/api/packets/${packet.leadId}/build`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebuild: false, archive: true }),
      });
      if (res.ok) {
        setMessage("Packet marked archived.");
        router.refresh();
      }
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="packet-preview mx-auto max-w-4xl space-y-6 pb-12">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .packet-preview { max-width: none; padding: 0; }
          body { background: white; color: black; }
          .packet-section { border: 1px solid #ccc; page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="nova-label">Lead Packet</p>
          <h1 className="text-2xl font-semibold text-[var(--nova-text-primary)]">
            {content.overview.propertyAddress ?? leadAddress ?? packet.leadId}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={packet.packetStatus === "review_ready" ? "success" : "warning"}>
              {packet.packetStatus.replace(/_/g, " ")}
            </Badge>
            <Badge variant="default">v{packet.packetVersion}</Badge>
            <Badge variant="info">{packet.sourceCount} sources</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="nova-btn-primary px-3 py-1.5 text-xs">
            Print Packet
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs"
            title="Use browser print to save as PDF"
          >
            Download PDF
          </button>
          <Link
            href={`/leads/${packet.leadId}?tab=attorney`}
            className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs"
          >
            Send to Attorney Review
          </Link>
          <button type="button" disabled={!!acting} onClick={archivePacket} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs">
            Archive Packet
          </button>
          <button type="button" disabled={acting === "rebuild"} onClick={rebuild} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs">
            {acting === "rebuild" ? <Loader2 className="inline h-3 w-3 animate-spin" /> : null} Rebuild Packet
          </button>
          <Link href={`/leads/${packet.leadId}`} className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs">
            Back to Lead
          </Link>
        </div>
      </div>

      {message && <p className="no-print text-sm text-[var(--nova-orange)]">{message}</p>}

      <PacketMissingDataChecklist packet={packet} />

      <Section title="Cover / Lead Summary">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Lead ID</dt><dd>{content.overview.leadId}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Estate / owner</dt><dd>{content.overview.estateName ?? content.overview.ownerName ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Address</dt><dd>{content.overview.propertyAddress ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">County / state</dt><dd>{content.overview.county}, {content.overview.state}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Status</dt><dd>{content.overview.leadStatus ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Source</dt><dd>{content.overview.leadSource ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Lead score</dt><dd>{content.overview.leadScore ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Confidence</dt><dd>{content.overview.confidenceScore ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Generated</dt><dd>{new Date(packet.generatedAt).toLocaleString()} by {packet.generatedBy}</dd></div>
        </dl>
      </Section>

      <Section title="Verification Snapshot">
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Sources</dt><dd>{packet.sourceCount}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Evidence items</dt><dd>{packet.evidenceCount}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Media</dt><dd>{packet.mediaCount}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Contacts</dt><dd>{packet.contactCount}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Contact confidence</dt><dd>{packet.confidenceSummary.contactConfidence ?? "—"}</dd></div>
          <div><dt className="text-xs text-[var(--nova-text-muted)]">Overall confidence</dt><dd>{packet.confidenceSummary.overall ?? "—"}</dd></div>
        </dl>
      </Section>

      <Section title="Source Citations">
        <PacketSourceCitations sources={content.sourceDiscovery} />
      </Section>

      <Section title="Probate / Death Evidence">
        <PacketEvidenceSection evidence={content.probateEvidence} />
      </Section>

      <Section title="Property Evidence & Media">
        <PacketPropertySection property={content.propertyEvidence} media={content.propertyMedia} />
      </Section>

      <Section title="Contact Candidates">
        <PacketContactSection contacts={content.contactCandidates} notFoundReason={content.contactNotFoundReason} />
      </Section>

      <Section title="Deal Estimate">
        <PacketDealSection estimate={content.dealEstimate} />
      </Section>

      <Section title="Compliance / Attorney Review">
        <PacketComplianceSection compliance={content.compliance} />
      </Section>

      {content.walkthrough && (
        <Section title="Walkthrough Summary">
          <p className="text-sm text-[var(--nova-text-secondary)]">
            Session {content.walkthrough.sessionId} · {content.walkthrough.status}
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--nova-text-secondary)]">
            {content.walkthrough.stepSummaries.map((s) => (
              <li key={s.stepId}>
                {s.stepId.replace(/_/g, " ")} — {s.decision ?? "completed"}
                {s.notes ? `: ${s.notes}` : ""}
              </li>
            ))}
          </ul>
          {content.walkthrough.missingItems.length > 0 && (
            <p className="mt-2 text-xs text-[var(--nova-orange)]">
              Missing walkthrough steps: {content.walkthrough.missingItems.join("; ")}
            </p>
          )}
        </Section>
      )}

      <Section title="Final Recommendation">
        <p className="text-lg font-medium capitalize text-[var(--nova-text-primary)]">
          {content.recommendation.recommendation.replace(/_/g, " ")}
        </p>
        {content.recommendation.rationale && (
          <p className="mt-2 text-sm text-[var(--nova-text-secondary)]">{content.recommendation.rationale}</p>
        )}
        {content.recommendation.pendingDecisionNote && (
          <p className="mt-2 text-sm text-[var(--nova-orange)]">{content.recommendation.pendingDecisionNote}</p>
        )}
      </Section>

      <Section title="Appendix / Raw Notes">
        {content.appendix.rawNotes.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-[var(--nova-text-secondary)]">
            {content.appendix.rawNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--nova-text-muted)]">No raw notes on file.</p>
        )}
        {content.appendix.auditExcerpt.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-xs text-[var(--nova-text-muted)]">
            {content.appendix.auditExcerpt.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-xs text-[var(--nova-text-muted)] italic">{GLOBAL_DISCLAIMER}</p>
    </div>
  );
}
