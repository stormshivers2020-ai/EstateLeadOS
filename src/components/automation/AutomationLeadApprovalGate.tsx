"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAutomation } from "./AutomationContext";
import { PacketButton } from "@/components/packets/PacketButton";
import { Badge } from "@/components/ui/Badge";
import { GOVERNMENT_STATUS_LABELS, type GovernmentVerificationStatus } from "@/lib/types/government";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface PendingLeadCard {
  id: string;
  propertyAddress: string;
  ownerName: string;
  sourceUrl: string;
  sourceTitle: string;
  snippet: string;
  state: string;
  county: string;
  estateLeadScore: number;
  dataConfidenceScore?: number;
  isGovernmentSource: boolean;
  governmentVerificationStatus: GovernmentVerificationStatus | null;
}

interface AutomationLeadApprovalGateProps {
  approvalId: string;
}

type ActingState = { id: string; action: "approve" | "reject" } | null;

export function AutomationLeadApprovalGate({ approvalId }: AutomationLeadApprovalGateProps) {
  const { approveDiscoveredLeadAndResume, setPanelOpen } = useAutomation();
  const [pending, setPending] = useState<PendingLeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<ActingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; leadId: string; propertyAddress: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/pending", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load pending leads.");
        setPending([]);
        return;
      }
      setPending(data.pending ?? []);
    } catch {
      setError("Could not load pending leads.");
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approveLead(pendingLeadId: string, propertyAddress: string) {
    setActing({ id: pendingLeadId, action: "approve" });
    setError(null);
    try {
      const result = await approveDiscoveredLeadAndResume(approvalId, pendingLeadId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess({
        message: result.message ?? `Lead approved. Automation resumed with ${propertyAddress}.`,
        leadId: result.leadId ?? "",
        propertyAddress,
      });
      setPending((prev) => prev.filter((p) => p.id !== pendingLeadId));
    } finally {
      setActing(null);
    }
  }

  async function rejectLead(pendingLeadId: string) {
    setActing({ id: pendingLeadId, action: "reject" });
    setError(null);
    try {
      const res = await fetch(`/api/leads/pending/${pendingLeadId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reject failed");
        return;
      }
      setPending((prev) => prev.filter((p) => p.id !== pendingLeadId));
    } finally {
      setActing(null);
    }
  }

  if (success) {
    return (
      <div className="space-y-3 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)] p-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nova-green)]" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--nova-text-primary)]">{success.message}</p>
            <div className="flex flex-wrap gap-2">
              {success.leadId && (
                <Link
                  href={`/leads/${success.leadId}`}
                  className="nova-btn-primary px-3 py-1.5 text-xs"
                >
                  Open Lead
                </Link>
              )}
              {success.leadId && (
                <Link
                  href={`/walkthrough/first-lead?leadId=${encodeURIComponent(success.leadId)}`}
                  className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)] hover:border-[var(--nova-gold)]"
                >
                  Start Walkthrough
                </Link>
              )}
              {success.leadId && <PacketButton leadId={success.leadId} variant="secondary" className="inline-block" />}
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)] hover:border-[var(--nova-gold)]"
              >
                Continue Automation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--nova-border)] px-4 py-6 text-sm text-[var(--nova-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading discovered leads…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--nova-text-muted)]">
          Pending lead review
        </p>
        <button
          type="button"
          onClick={load}
          disabled={!!acting}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--nova-border)] px-2 py-1 text-[10px] text-[var(--nova-text-muted)] hover:border-[var(--nova-gold)] disabled:opacity-50"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-[rgba(255,180,84,0.25)] bg-[rgba(255,180,84,0.06)] px-3 py-2 text-xs text-[var(--nova-orange)]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Approval means this lead will enter the EstateLeadOS pipeline for verification. It does not mean the lead is
            legally verified or ready for outreach.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-[rgba(255,94,94,0.3)] bg-[rgba(255,94,94,0.08)] px-3 py-2 text-xs text-[var(--nova-red)]">
          {error}
        </p>
      )}

      {pending.length === 0 ? (
        <div className="rounded-lg border border-[var(--nova-border)] px-4 py-6 text-center text-sm text-[var(--nova-text-muted)]">
          No approved leads remain. Run another search or stop automation.
        </div>
      ) : (
        pending.map((lead) => {
          const isActing = acting?.id === lead.id;
          const isApproving = isActing && acting.action === "approve";
          const isRejecting = isActing && acting.action === "reject";
          const govStatus = lead.governmentVerificationStatus
            ? GOVERNMENT_STATUS_LABELS[lead.governmentVerificationStatus]
            : null;

          return (
            <div
              key={lead.id}
              className="rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg-primary)] p-4 space-y-3"
            >
              <div className="space-y-1">
                <p className="font-medium text-[var(--nova-text-primary)]">{lead.propertyAddress}</p>
                {lead.ownerName && lead.ownerName !== "Unknown" && (
                  <p className="text-sm text-[var(--nova-text-secondary)]">{lead.ownerName}</p>
                )}
                <p className="text-xs text-[var(--nova-text-muted)]">
                  {lead.county}, {lead.state}
                </p>
              </div>

              <div className="space-y-1 rounded-lg border border-[var(--nova-border)] bg-white/[0.02] px-3 py-2">
                <p className="text-xs font-medium text-[var(--nova-text-secondary)]">{lead.sourceTitle}</p>
                <p className="text-xs text-[var(--nova-text-muted)] line-clamp-3">{lead.snippet}</p>
                {lead.sourceUrl && (
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--nova-blue)] hover:underline"
                  >
                    Open Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="info">Estate score {lead.estateLeadScore}</Badge>
                <Badge variant="default">Confidence {lead.dataConfidenceScore ?? "—"}</Badge>
                {lead.isGovernmentSource && <Badge variant="success">Government source</Badge>}
                {govStatus && <Badge variant="warning">{govStatus}</Badge>}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={!!acting}
                  onClick={() => approveLead(lead.id, lead.propertyAddress)}
                  className="nova-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Approve Lead & Continue
                </button>
                <button
                  type="button"
                  disabled={!!acting}
                  onClick={() => rejectLead(lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(255,94,94,0.3)] px-3 py-1.5 text-xs text-[var(--nova-red)] disabled:opacity-50"
                >
                  {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Reject Lead
                </button>
                {lead.sourceUrl && (
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--nova-border)] px-3 py-1.5 text-xs text-[var(--nova-text-secondary)] hover:border-[var(--nova-gold)]"
                  >
                    Open Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
