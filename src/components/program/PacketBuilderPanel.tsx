"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PACKET_TYPE_LABELS, PACKET_STATUS_LABELS, type LeadPacketType } from "@/lib/types/program";
import type { LeadPacket, RequiredDocument } from "@/lib/types/program";
import { FileText, Printer, Archive, Loader2, Play } from "lucide-react";
import { RunEstateLeadOSModal } from "./RunEstateLeadOSModal";

interface PacketBuilderPanelProps {
  leadId: string;
}

const PACKET_TYPES: LeadPacketType[] = [
  "internal_review",
  "seller_outreach_prep",
  "buyer_investor_opportunity",
  "assignment_readiness",
  "attorney_title_review",
  "full_lead_archive",
];

export function PacketBuilderPanel({ leadId }: PacketBuilderPanelProps) {
  const [packets, setPackets] = useState<LeadPacket[]>([]);
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [selectedType, setSelectedType] = useState<LeadPacketType>("internal_review");
  const [runOpen, setRunOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/archive?leadId=${leadId}`);
      const json = await res.json();
      setPackets(json.packets ?? []);
      const docRes = await fetch("/api/program/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find_missing_documents", leadId, mode: "assisted" }),
      });
      const docJson = await docRes.json();
      if (docJson.details?.documents) setDocuments(docJson.details.documents);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function buildPacket() {
    setBuilding(true);
    try {
      await fetch("/api/program/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "build_printable_packets", leadId, packetType: selectedType, mode: "assisted" }),
      });
      await load();
    } finally {
      setBuilding(false);
    }
  }

  async function printPacket(packetId: string) {
    const res = await fetch(`/api/packets/${packetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "print" }),
    });
    const json = await res.json();
    if (json.printableHtml) {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(json.printableHtml);
        w.document.close();
        w.print();
      }
    }
  }

  async function archiveLatest() {
    if (packets.length === 0) return;
    await fetch(`/api/packets/${packets[0].id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    await load();
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading packet builder…</div>;
  }

  const missingCount = documents.filter((d) => ["missing", "needs_manual_research", "needs_upload"].includes(d.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRunOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white">
          <Play className="h-3 w-3" /> Run Lead Packet Builder
        </button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Required Documents ({missingCount} missing)</CardTitle></CardHeader>
        <CardContent>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-400">
            {documents.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>{d.documentName}</span>
                <Badge variant={d.status === "missing" ? "warning" : "default"}>{d.status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Build Printable Packet</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as LeadPacketType)}
          >
            {PACKET_TYPES.map((t) => (
              <option key={t} value={t}>{PACKET_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={building}
            onClick={buildPacket}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Build Packet
          </button>
        </CardContent>
      </Card>

      {packets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Packets (v{packets[0].packetVersion} latest)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {packets.slice(0, 5).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700/50 p-2 text-sm">
                <div>
                  <p className="text-slate-200">{PACKET_TYPE_LABELS[p.packetType]} v{p.packetVersion}</p>
                  <p className="text-xs text-slate-500">{PACKET_STATUS_LABELS[p.packetStatus]}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => printPacket(p.id)} className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">
                    <Printer className="h-3 w-3" /> Print
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={archiveLatest} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300">
              <Archive className="h-3 w-3" /> Save to Archive
            </button>
          </CardContent>
        </Card>
      )}

      <RunEstateLeadOSModal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        leadId={leadId}
        defaultAction="full_lead_to_packet_workflow"
        onComplete={() => load()}
      />
    </div>
  );
}
