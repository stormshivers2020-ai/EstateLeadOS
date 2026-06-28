"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ACQUISITION_PACKET_DISCLAIMER,
  PACKET_TYPE_LABELS,
  PACKET_STATUS_LABELS,
  PRIMARY_PACKET_TYPES,
  type LeadPacketType,
} from "@/lib/types/program";
import type { LeadPacket, RequiredDocument } from "@/lib/types/program";
import {
  archivePacketAction,
  buildPacketAction,
  fetchPacketById,
  findMissingDocumentsAction,
  generatePdfPlaceholderAction,
  loadLeadArchiveData,
  printPacketAction,
  saveDraftPacketAction,
  saveToFirstArchiveAction,
  sendToAttorneyReviewAction,
} from "@/lib/services/program/client-program";
import { FIRST_ARCHIVE_STEP } from "@/lib/constants/process-steps";
import { DraftDocumentsPanel } from "./DraftDocumentsPanel";
import {
  FileText,
  Printer,
  Archive,
  Loader2,
  Play,
  ExternalLink,
  AlertCircle,
  Save,
  Scale,
  FileDown,
} from "lucide-react";
import { RunEstateLeadOSModal } from "./RunEstateLeadOSModal";

interface PacketBuilderPanelProps {
  leadId: string;
}

export function PacketBuilderPanel({ leadId }: PacketBuilderPanelProps) {
  const [packets, setPackets] = useState<LeadPacket[]>([]);
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<LeadPacketType>("acquisition_preparation");
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await loadLeadArchiveData(leadId);
      const nextPackets = json.packets ?? [];
      setPackets(nextPackets);
      setSelectedPacketId((prev) => prev ?? nextPackets[0]?.id ?? null);
      const docJson = await findMissingDocumentsAction(leadId);
      setDocuments(docJson.documents ?? []);
    } catch {
      setError("Could not load packet builder data.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function buildPacket() {
    setBuilding(true);
    setError(null);
    setMessage(null);
    try {
      const result = await buildPacketAction(leadId, selectedType);
      if (!result.success) {
        setError(result.error ?? "Failed to build packet.");
        return;
      }
      setMessage(result.message ?? "Acquisition packet built.");
      await load();
    } finally {
      setBuilding(false);
    }
  }

  async function openPacket(packetId: string) {
    setError(null);
    const packet = await fetchPacketById(packetId);
    if (packet?.printableHtml) {
      setSelectedPacketId(packetId);
      setPrintHtml(packet.printableHtml);
      return;
    }
    setError("Could not open packet preview.");
  }

  async function printPacket(packetId: string) {
    setError(null);
    setBusyAction("print");
    try {
      const json = await printPacketAction(packetId, leadId);
      if (json.printableHtml) {
        setPrintHtml(json.printableHtml);
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(json.printableHtml);
          w.document.close();
          w.print();
        } else {
          setError("Pop-up blocked. Use the preview below and print from your browser.");
        }
        return;
      }
      setError(json.error ?? "Could not print packet.");
    } finally {
      setBusyAction(null);
    }
  }

  async function runAction(
    action: string,
    fn: () => Promise<{ error?: string; message?: string; success?: boolean; pdfUrl?: string }>
  ) {
    const targetId = selectedPacketId ?? packets[0]?.id;
    if (!targetId) {
      setError("Build a packet first.");
      return;
    }
    setBusyAction(action);
    setError(null);
    setMessage(null);
    try {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? "Done.");
      await load();
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Acquisition Packet Builder…
      </div>
    );
  }

  const missingCount = documents.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload"].includes(d.status)
  ).length;
  const activePacket = packets.find((p) => p.id === selectedPacketId) ?? packets[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <p className="font-medium">EstateLeadOS · Powered by SCS Nova</p>
        <p className="mt-1 text-xs text-amber-200/90">{ACQUISITION_PACKET_DISCLAIMER}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white"
        >
          <Play className="h-3 w-3" /> Run Lead Packet Builder
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Documents ({missingCount} missing)</CardTitle>
        </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-base">Acquisition Packet Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as LeadPacketType)}
          >
            {PRIMARY_PACKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {PACKET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={building}
            onClick={buildPacket}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Build Acquisition Packet
          </button>
        </CardContent>
      </Card>

      {packets.length > 0 && activePacket && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {PACKET_TYPE_LABELS[activePacket.packetType]} (v{activePacket.packetVersion})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">{PACKET_STATUS_LABELS[activePacket.packetStatus]}</p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => openPacket(activePacket.id)}
                className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1.5 text-xs text-slate-300"
              >
                <ExternalLink className="h-3 w-3" /> Preview Packet
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => printPacket(activePacket.id)}
                className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1.5 text-xs text-slate-300"
              >
                {busyAction === "print" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                Print Packet
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  runAction("draft", async () => {
                    const r = await saveDraftPacketAction(leadId, selectedType);
                    return { message: r.message, error: r.error, success: r.success };
                  })
                }
                className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1.5 text-xs text-slate-300"
              >
                <Save className="h-3 w-3" /> Save Draft
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  runAction("pdf", async () => {
                    const r = await generatePdfPlaceholderAction(activePacket.id);
                    return {
                      message: r.pdfUrl ? "PDF placeholder saved." : undefined,
                      error: r.error,
                    };
                  })
                }
                className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1.5 text-xs text-slate-300"
              >
                <FileDown className="h-3 w-3" /> Generate PDF Placeholder
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  runAction("first_archive", async () => {
                    const r = await saveToFirstArchiveAction(activePacket.id);
                    return { message: r.message, error: r.error };
                  })
                }
                className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-900/20 px-2 py-1.5 text-xs text-emerald-200"
              >
                <Archive className="h-3 w-3" /> Save to First Archive (Step {FIRST_ARCHIVE_STEP})
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  runAction("attorney", async () => {
                    const r = await sendToAttorneyReviewAction(leadId, activePacket.id);
                    return { message: r.message, error: r.error, success: r.success };
                  })
                }
                className="inline-flex items-center gap-1 rounded border border-amber-700/60 bg-amber-900/20 px-2 py-1.5 text-xs text-amber-200"
              >
                <Scale className="h-3 w-3" /> Send to Attorney Review
              </button>
            </div>

            {packets.length > 1 && (
              <div className="space-y-1 border-t border-slate-700/50 pt-3">
                <p className="text-xs text-slate-500">Other versions</p>
                {packets.slice(1, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPacketId(p.id)}
                    className="block w-full rounded border border-slate-700/40 px-2 py-1 text-left text-xs text-slate-400 hover:border-slate-600"
                  >
                    {PACKET_TYPE_LABELS[p.packetType]} v{p.packetVersion}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() =>
                runAction("archive", async () => {
                  const r = await archivePacketAction(activePacket.id);
                  return { message: "Packet saved to archive.", error: r.error };
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
            >
              <Archive className="h-3 w-3" /> Save to Archive
            </button>
          </CardContent>
        </Card>
      )}

      <DraftDocumentsPanel leadId={leadId} packetId={activePacket?.id} />

      {printHtml && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Packet Preview</CardTitle>
            <button type="button" onClick={() => setPrintHtml(null)} className="text-xs text-slate-500">
              Close
            </button>
          </CardHeader>
          <CardContent>
            <iframe
              title="Packet preview"
              srcDoc={printHtml}
              className="h-[500px] w-full rounded border border-slate-700 bg-white"
            />
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
