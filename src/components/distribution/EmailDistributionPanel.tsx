"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import {
  EMAIL_DISTRIBUTION_WORKFLOW_STEPS,
  NO_AUTO_SEND_NOTICE,
  DISTRIBUTION_BRAND_FOOTER,
} from "@/lib/constants/email-distribution-workflow";
import {
  DISTRIBUTION_PACKET_WARNING,
  DISTRIBUTION_STATUS_LABELS,
  DISTRIBUTION_TYPE_LABELS,
  MANUAL_OVERRIDE_TEXT,
} from "@/lib/types/distribution";
import type {
  DistributionPacket,
  DistributionPacketType,
  EmailDistribution,
  ExternalRecipient,
} from "@/lib/types/distribution";
import type { LeadArchive } from "@/lib/types/program";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Send,
  Archive,
  Eye,
} from "lucide-react";

interface EmailDistributionPanelProps {
  leadId: string;
  propertyAddress?: string;
  initialFinalArchiveId?: string;
  initialRecipientId?: string;
  initialRecipientEmail?: string;
}

const PACKET_TYPES: DistributionPacketType[] = [
  "buyer_opportunity",
  "realtor_review",
  "investor_review",
  "real_estate_company",
  "title_company_review",
];

export function EmailDistributionPanel({
  leadId,
  propertyAddress,
  initialFinalArchiveId,
  initialRecipientId,
  initialRecipientEmail,
}: EmailDistributionPanelProps) {
  const [workflowStep, setWorkflowStep] = useState(1);
  const [packets, setPackets] = useState<DistributionPacket[]>([]);
  const [finalArchives, setFinalArchives] = useState<LeadArchive[]>([]);
  const [recipients, setRecipients] = useState<ExternalRecipient[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDistribution[]>([]);
  const [gate, setGate] = useState<{ allowed: boolean; blockers: string[]; complianceBlockers?: string[] } | null>(null);
  const [providerConfigured, setProviderConfigured] = useState(false);

  const [selectedArchiveId, setSelectedArchiveId] = useState(initialFinalArchiveId ?? "");
  const [packetType, setPacketType] = useState<DistributionPacketType>("buyer_opportunity");
  const [hideProfitNotes, setHideProfitNotes] = useState(true);
  const [selectedPacketId, setSelectedPacketId] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState(initialRecipientId ?? "");
  const [dncConfirmed, setDncConfirmed] = useState(false);
  const [attorneyConfirmed, setAttorneyConfirmed] = useState(false);
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);
  const [redactionConfirmed, setRedactionConfirmed] = useState(false);
  const [attachConfirmed, setAttachConfirmed] = useState(false);
  const [finalApproval, setFinalApproval] = useState(false);
  const [previewApproved, setPreviewApproved] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [lastEmailId, setLastEmailId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pktRes, emailRes] = await Promise.all([
        fetch(`/api/distribution/packets?leadId=${encodeURIComponent(leadId)}`),
        fetch(`/api/distribution/email?leadId=${encodeURIComponent(leadId)}`),
      ]);
      const pktJson = await pktRes.json();
      const emailJson = await emailRes.json();
      setPackets(pktJson.packets ?? []);
      setFinalArchives(pktJson.finalArchives ?? []);
      setGate(pktJson.gate ?? null);
      setRecipients(emailJson.recipients ?? []);
      setEmailLogs(emailJson.logs ?? []);
      setProviderConfigured(emailJson.providerConfigured ?? false);
      if (!selectedArchiveId && pktJson.finalArchives?.[0]?.id) {
        setSelectedArchiveId(pktJson.finalArchives[0].id);
      }
      if (!selectedPacketId && pktJson.packets?.[0]?.id) {
        setSelectedPacketId(pktJson.packets[0].id);
      }
      if (!selectedRecipientId && emailJson.recipients?.length) {
        const byEmail = initialRecipientEmail
          ? emailJson.recipients.find((r: ExternalRecipient) => r.email === initialRecipientEmail)
          : null;
        if (byEmail) setSelectedRecipientId(byEmail.id);
        else if (initialRecipientId) setSelectedRecipientId(initialRecipientId);
      }
    } finally {
      setLoading(false);
    }
  }, [leadId, selectedArchiveId, selectedPacketId, selectedRecipientId, initialRecipientEmail, initialRecipientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (initialFinalArchiveId) setSelectedArchiveId(initialFinalArchiveId);
    if (initialRecipientId) setSelectedRecipientId(initialRecipientId);
  }, [initialFinalArchiveId, initialRecipientId]);

  const activePacket = useMemo(
    () => packets.find((p) => p.id === selectedPacketId),
    [packets, selectedPacketId]
  );
  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === selectedRecipientId),
    [recipients, selectedRecipientId]
  );
  const selectedArchive = useMemo(
    () => finalArchives.find((a) => a.id === selectedArchiveId),
    [finalArchives, selectedArchiveId]
  );

  async function buildPacket() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/distribution/packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          leadId,
          packetType,
          finalArchiveId: selectedArchiveId,
          hideInternalProfitNotes: hideProfitNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSelectedPacketId(json.packet.id);
      setMessage(`${DISTRIBUTION_TYPE_LABELS[packetType]} v${json.packet.packetVersion} generated from Final Archive.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Build failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRedaction(itemId: string, complete: boolean) {
    if (!activePacket) return;
    await fetch("/api/distribution/packets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redaction", packetId: activePacket.id, itemId, complete }),
    });
    await load();
  }

  async function approveForSend() {
    if (!activePacket) return;
    setError(null);
    try {
      const res = await fetch("/api/distribution/packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_send", packetId: activePacket.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage("Packet approved for send — email preview still required.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    }
  }

  async function loadEmailPreview() {
    if (!activePacket || !selectedRecipient) return;
    const res = await fetch("/api/distribution/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "preview",
        leadId,
        distributionPacketId: activePacket.id,
        recipientEmail: selectedRecipient.email,
        recipientId: selectedRecipient.id,
        vars: {
          property_address: propertyAddress ?? leadId,
          recipient_name: selectedRecipient.name,
          sender_name: "EstateLeadOS Operator",
        },
      }),
    });
    const json = await res.json();
    setSubject(json.subject ?? "");
    setBody(json.body ?? "");
  }

  async function sendEmail() {
    if (!activePacket || !selectedRecipient) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/distribution/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          leadId,
          distributionPacketId: activePacket.id,
          recipientId: selectedRecipient.id,
          recipientEmail: selectedRecipient.email,
          recipientName: selectedRecipient.name,
          subject,
          body,
          userApprovedPreview: previewApproved && finalApproval,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLastEmailId(json.result?.id ?? null);
      setMessage(json.message ?? (json.result?.simulated ? "Email simulated" : "Email sent"));
      setWorkflowStep(12);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function scheduleFollowUp() {
    if (!lastEmailId || !followUpDate) return;
    setBusy(true);
    try {
      const res = await fetch("/api/distribution/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule_follow_up", emailId: lastEmailId, followUpAt: followUpDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage(json.message);
      setWorkflowStep(14);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Schedule failed");
    } finally {
      setBusy(false);
    }
  }

  async function archiveRecord() {
    if (!lastEmailId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/distribution/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive_record", emailId: lastEmailId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage(json.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  }

  function canAdvanceStep(step: number): boolean {
    switch (step) {
      case 1:
        return Boolean(selectedArchiveId);
      case 2:
        return Boolean(packetType);
      case 3:
        return Boolean(selectedRecipientId);
      case 4:
        return dncConfirmed && !selectedRecipient?.doNotContact;
      case 5:
        return attorneyConfirmed;
      case 6:
        return complianceConfirmed && (gate?.complianceBlockers?.length ?? 0) === 0;
      case 7:
        return redactionConfirmed && (activePacket?.redactionChecklist.every((r) => r.complete) ?? false);
      case 8:
        return Boolean(subject && body);
      case 9:
        return attachConfirmed;
      case 10:
        return finalApproval;
      case 11:
        return previewApproved && finalApproval && activePacket?.packetStatus === "approved_to_send";
      default:
        return true;
    }
  }

  if (loading && !packets.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading email distribution…
      </div>
    );
  }

  const stepMeta = EMAIL_DISTRIBUTION_WORKFLOW_STEPS[workflowStep - 1];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-slate-200">{DISTRIBUTION_BRAND_FOOTER}</p>
        <p className="mt-1 text-xs">{GLOBAL_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-amber-200/80">{DISTRIBUTION_PACKET_WARNING}</p>
        <p className="mt-1 text-xs text-sky-300">{NO_AUTO_SEND_NOTICE}</p>
        {isLocalPreviewMode() && (
          <p className="mt-1 text-xs text-emerald-300">Local Preview Mode: simulate send only — no real email.</p>
        )}
        {!isLocalPreviewMode() && !providerConfigured && (
          <p className="mt-1 text-xs text-red-300">Production: email provider not configured — send will be blocked.</p>
        )}
      </div>

      {gate && !gate.allowed && workflowStep < 11 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="list-disc pl-4 text-xs">{gate.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" /> Email Distribution — Step {workflowStep} of 14
          </CardTitle>
          <Badge variant="info">{stepMeta?.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflowStep === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Select a Final Attorney-Reviewed Archive file as the source.</p>
              {finalArchives.length === 0 ? (
                <p className="text-sm text-amber-200">
                  No Final Archive yet.{" "}
                  <Link href={`/leads/${leadId}?tab=attorney`} className="text-sky-400 underline">
                    Complete attorney review (Step 19)
                  </Link>
                </p>
              ) : (
                <select
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
                  value={selectedArchiveId}
                  onChange={(e) => setSelectedArchiveId(e.target.value)}
                >
                  {finalArchives.map((a) => (
                    <option key={a.id} value={a.id}>
                      Final Archive v{a.packetVersion} — {a.propertyAddress ?? a.leadId} ({new Date(a.archivedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {workflowStep === 2 && (
            <div className="space-y-3">
              <select
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
                value={packetType}
                onChange={(e) => setPacketType(e.target.value as DistributionPacketType)}
              >
                {PACKET_TYPES.map((t) => (
                  <option key={t} value={t}>{DISTRIBUTION_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={hideProfitNotes} onChange={(e) => setHideProfitNotes(e.target.checked)} />
                Hide internal profit notes from external packet
              </label>
              <button
                type="button"
                disabled={busy || !selectedArchiveId}
                onClick={buildPacket}
                className="rounded-lg bg-sky-700 px-3 py-2 text-xs text-white disabled:opacity-50"
              >
                Generate External Distribution Packet
              </button>
              {activePacket && (
                <p className="text-xs text-slate-500">
                  Current: {DISTRIBUTION_TYPE_LABELS[activePacket.packetType]} v{activePacket.packetVersion} — separate from internal archive
                </p>
              )}
            </div>
          )}

          {workflowStep === 3 && (
            <select
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
            >
              <option value="">Select recipient</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id} disabled={r.doNotContact}>
                  {r.name} — {r.email} ({r.recipientType}){r.doNotContact ? " [DNC]" : ""}
                </option>
              ))}
            </select>
          )}

          {workflowStep === 4 && (
            <div className="space-y-2 text-sm">
              {selectedRecipient?.doNotContact ? (
                <p className="text-red-300">This recipient is Do Not Contact — cannot proceed.</p>
              ) : (
                <>
                  <p className="text-slate-400">Confirm recipient is not on Do Not Contact list.</p>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={dncConfirmed} onChange={(e) => setDncConfirmed(e.target.checked)} />
                    I confirm this recipient is not marked Do Not Contact
                  </label>
                </>
              )}
            </div>
          )}

          {workflowStep === 5 && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">{MANUAL_OVERRIDE_TEXT}</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={attorneyConfirmed} onChange={(e) => setAttorneyConfirmed(e.target.checked)} />
                I confirm attorney review is complete or manual override was acknowledged
              </label>
              <Link href={`/leads/${leadId}?tab=attorney`} className="text-xs text-sky-400">Open Attorney Review →</Link>
            </div>
          )}

          {workflowStep === 6 && (
            <div className="space-y-2 text-sm">
              {(gate?.complianceBlockers?.length ?? 0) > 0 ? (
                <ul className="list-disc pl-4 text-amber-200 text-xs">
                  {gate!.complianceBlockers!.map((b) => <li key={b}>{b}</li>)}
                </ul>
              ) : (
                <p className="text-emerald-300 text-xs">No active compliance blockers detected.</p>
              )}
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={complianceConfirmed} onChange={(e) => setComplianceConfirmed(e.target.checked)} />
                I confirm compliance blockers are clear or resolved
              </label>
            </div>
          )}

          {workflowStep === 7 && activePacket && (
            <div className="space-y-2">
              <ul className="space-y-1 text-xs text-slate-400">
                {activePacket.redactionChecklist.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={r.complete} onChange={(e) => toggleRedaction(r.id, e.target.checked)} />
                      {r.label}
                    </label>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={approveForSend} className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-300">
                Approve External Sharing
              </button>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={redactionConfirmed} onChange={(e) => setRedactionConfirmed(e.target.checked)} />
                Redaction checklist complete
              </label>
            </div>
          )}

          {workflowStep === 8 && (
            <div className="space-y-2">
              <button type="button" onClick={loadEmailPreview} className="text-xs text-sky-400">Load safe email template</button>
              <input className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              <textarea className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" />
            </div>
          )}

          {workflowStep === 9 && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">
                Attachment: {activePacket ? `${DISTRIBUTION_TYPE_LABELS[activePacket.packetType]} v${activePacket.packetVersion}.html` : "—"}
              </p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={attachConfirmed} onChange={(e) => setAttachConfirmed(e.target.checked)} />
                I confirm the distribution packet is attached for send
              </label>
            </div>
          )}

          {workflowStep === 10 && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={finalApproval} onChange={(e) => setFinalApproval(e.target.checked)} />
              Final user approval — I authorize this one email send (no auto-send, no bulk blast)
            </label>
          )}

          {workflowStep === 11 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={previewApproved} onChange={(e) => setPreviewApproved(e.target.checked)} />
                Email preview reviewed and approved for send
              </label>
              <button
                type="button"
                disabled={busy || !canAdvanceStep(11)}
                onClick={sendEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isLocalPreviewMode() ? "Simulate Send" : "Send Email"}
              </button>
              <p className="text-xs text-slate-500">EstateLeadOS does not guarantee buyer response or assignment fee.</p>
            </div>
          )}

          {workflowStep === 12 && (
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Email logged — {emailLogs[0]?.simulated ? "simulated" : "sent"} record saved.
            </div>
          )}

          {workflowStep === 13 && (
            <div className="space-y-2">
              <input
                type="datetime-local"
                className="rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <button type="button" disabled={busy || !followUpDate} onClick={scheduleFollowUp} className="rounded border border-sky-700/50 px-3 py-1 text-xs text-sky-300">
                Schedule Follow-Up
              </button>
              <button type="button" onClick={() => setWorkflowStep(14)} className="ml-2 text-xs text-slate-500">Skip</button>
            </div>
          )}

          {workflowStep === 14 && (
            <div className="space-y-2">
              <button type="button" disabled={busy} onClick={archiveRecord} className="inline-flex items-center gap-2 rounded border border-purple-700/50 px-3 py-2 text-xs text-purple-200">
                <Archive className="h-3 w-3" /> Archive Distribution Record to Final Archive
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
            <button
              type="button"
              disabled={workflowStep <= 1}
              onClick={() => setWorkflowStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1 text-xs text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
            <button
              type="button"
              disabled={workflowStep >= 14 || !canAdvanceStep(workflowStep)}
              onClick={() => setWorkflowStep((s) => Math.min(14, s + 1))}
              className="inline-flex items-center gap-1 text-xs text-sky-400 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </CardContent>
      </Card>

      {activePacket?.printableHtml && workflowStep >= 8 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" /> Distribution Packet Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <iframe title="Distribution preview" srcDoc={activePacket.printableHtml} className="h-[400px] w-full rounded border border-slate-700 bg-white" />
          </CardContent>
        </Card>
      )}

      {packets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Distribution Packets (External — Not Internal Archive)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {packets.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-700/50 p-2 text-xs">
                <span className="text-slate-200">{DISTRIBUTION_TYPE_LABELS[p.packetType]} v{p.packetVersion}</span>
                <Badge variant="default">{DISTRIBUTION_STATUS_LABELS[p.packetStatus]}</Badge>
                {p.finalArchiveId && <span className="text-slate-500">Final Archive linked</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {emailLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Email Log</CardTitle></CardHeader>
          <CardContent>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-500">
              {emailLogs.slice(0, 20).map((log) => (
                <li key={log.id}>
                  {new Date(log.sentAt ?? log.createdAt).toLocaleString()} · {log.recipientEmail} · {log.sendStatus}
                  {log.simulated && " (simulated)"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/buyer-network" className="text-sky-400">Buyer Network → Send Packet</Link>
        <Link href={`/archive/final?lead=${leadId}`} className="text-sky-400">Final Archive → Send Final Packet</Link>
      </div>
    </div>
  );
}
