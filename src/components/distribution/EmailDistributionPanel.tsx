"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { DISTRIBUTION_PACKET_WARNING, DISTRIBUTION_STATUS_LABELS } from "@/lib/types/distribution";
import type { DistributionPacket, ExternalRecipient } from "@/lib/types/distribution";
import { DISTRIBUTION_TYPE_LABELS } from "@/lib/types/distribution";
import { Mail, Loader2, Send, AlertTriangle } from "lucide-react";
import { isLocalPreviewMode } from "@/lib/config/runtime";

interface EmailDistributionPanelProps {
  leadId: string;
  propertyAddress?: string;
}

export function EmailDistributionPanel({ leadId, propertyAddress }: EmailDistributionPanelProps) {
  const [packets, setPackets] = useState<DistributionPacket[]>([]);
  const [recipients, setRecipients] = useState<ExternalRecipient[]>([]);
  const [gate, setGate] = useState<{ allowed: boolean; blockers: string[] } | null>(null);
  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pktRes, emailRes] = await Promise.all([
        fetch(`/api/distribution/packets?leadId=${leadId}`),
        fetch("/api/distribution/email"),
      ]);
      const pktJson = await pktRes.json();
      const emailJson = await emailRes.json();
      setPackets(pktJson.packets ?? []);
      setGate(pktJson.gate ?? null);
      setRecipients(emailJson.recipients ?? []);
      if (pktJson.packets?.[0]) setSelectedPacket(pktJson.packets[0].id);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function buildDistribution() {
    setBusy(true);
    await fetch("/api/distribution/packets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "build", leadId, packetType: "buyer_opportunity" }),
    });
    await load();
    setBusy(false);
  }

  async function toggleRedaction(packetId: string, itemId: string, complete: boolean) {
    await fetch("/api/distribution/packets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redaction", packetId, itemId, complete }),
    });
    await load();
  }

  async function approveForSend(packetId: string) {
    setError(null);
    try {
      const res = await fetch("/api/distribution/packets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_send", packetId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    }
  }

  async function loadTemplate() {
    const res = await fetch("/api/distribution/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "preview",
        templateId: "buyer_opportunity",
        leadId,
        distributionPacketId: selectedPacket,
        recipientEmail: recipients.find((r) => r.id === selectedRecipient)?.email ?? "",
        recipientId: selectedRecipient,
        vars: {
          property_address: propertyAddress ?? leadId,
          recipient_name: recipients.find((r) => r.id === selectedRecipient)?.name ?? "Recipient",
          sender_name: "EstateLeadOS Operator",
        },
      }),
    });
    const json = await res.json();
    setSubject(json.subject ?? "");
    setBody(json.body ?? "");
  }

  async function sendEmail() {
    setBusy(true);
    setError(null);
    setResult(null);
    const recipient = recipients.find((r) => r.id === selectedRecipient);
    try {
      const res = await fetch("/api/distribution/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          leadId,
          distributionPacketId: selectedPacket,
          recipientId: selectedRecipient,
          recipientEmail: recipient?.email,
          recipientName: recipient?.name,
          subject,
          body,
          userApprovedPreview: approved,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json.result?.simulated ? "Email simulated (Local Preview Mode)" : "Email sent");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  const activePacket = packets.find((p) => p.id === selectedPacket);

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading email distribution…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        <p>{GLOBAL_DISCLAIMER}</p>
        <p className="mt-2 text-xs text-amber-200/80">{DISTRIBUTION_PACKET_WARNING}</p>
        {isLocalPreviewMode() && (
          <p className="mt-1 text-xs text-sky-300">Local Preview Mode: emails are simulated only.</p>
        )}
      </div>

      {gate && !gate.allowed && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="list-disc pl-4 text-xs">{gate.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Buyer / Realtor Distribution Packet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <button type="button" disabled={busy} onClick={buildDistribution} className="rounded-lg bg-sky-700 px-3 py-2 text-xs text-white">
            Generate Distribution Packet (External-Facing)
          </button>
          {packets.map((p) => (
            <div key={p.id} className="rounded border border-slate-700/50 p-2 text-sm">
              <p className="text-slate-200">{DISTRIBUTION_TYPE_LABELS[p.packetType]} v{p.packetVersion}</p>
              <Badge variant="default">{DISTRIBUTION_STATUS_LABELS[p.packetStatus]}</Badge>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {p.redactionChecklist.map((r) => (
                  <li key={r.id}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={r.complete} onChange={(e) => toggleRedaction(p.id, r.id, e.target.checked)} />
                      {r.label}
                    </label>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => approveForSend(p.id)} className="mt-2 rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-300">
                Approve for Send
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Email Distribution</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" value={selectedPacket} onChange={(e) => setSelectedPacket(e.target.value)}>
            {packets.map((p) => (
              <option key={p.id} value={p.id}>{DISTRIBUTION_TYPE_LABELS[p.packetType]} v{p.packetVersion} — {p.packetStatus}</option>
            ))}
          </select>
          <select className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
            <option value="">Select recipient</option>
            {recipients.filter((r) => !r.doNotContact).map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.email} ({r.recipientType})</option>
            ))}
          </select>
          <button type="button" onClick={loadTemplate} className="text-xs text-sky-400">Load safe email template</button>
          <input className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <textarea className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-sm" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
            I approve this email preview for send (required)
          </label>
          <button
            type="button"
            disabled={busy || !approved || activePacket?.packetStatus !== "approved_to_send"}
            onClick={sendEmail}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Email {isLocalPreviewMode() ? "(Simulated)" : ""}
          </button>
          {result && <p className="text-sm text-emerald-300">{result}</p>}
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Link href="/buyer-network" className="text-xs text-sky-400">Manage recipients in Buyer Network →</Link>
        </CardContent>
      </Card>
    </div>
  );
}
