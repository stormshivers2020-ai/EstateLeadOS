"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GLOBAL_DISCLAIMER } from "@/lib/constants/disclaimer";
import { PACKET_TYPE_LABELS, PACKET_STATUS_LABELS } from "@/lib/types/program";
import type { LeadArchive, LeadPacket } from "@/lib/types/program";
import { Archive, Printer, ExternalLink, Loader2 } from "lucide-react";
import { RunEstateLeadOSModal } from "./RunEstateLeadOSModal";

interface ArchiveOverview {
  total: number;
  readyForReview: number;
  missingDocuments: number;
  archives: LeadArchive[];
}

export function ArchiveClient() {
  const [data, setData] = useState<ArchiveOverview | null>(null);
  const [packets, setPackets] = useState<LeadPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/archive");
      const json = await res.json();
      setData(json);
      setPackets(json.archives?.map((a: LeadArchive) => ({ id: a.packetId })) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openPacket(packetId: string) {
    const res = await fetch(`/api/archive?packetId=${packetId}`);
    const json = await res.json();
    if (json.packet?.printableHtml) setPrintHtml(json.packet.printableHtml);
  }

  async function printPacket(packetId: string, leadId: string) {
    const res = await fetch(`/api/packets/${packetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "print" }),
    });
    const json = await res.json();
    if (json.printableHtml) {
      setPrintHtml(json.printableHtml);
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(json.printableHtml);
        w.document.close();
        w.print();
      }
    }
    void leadId;
  }

  if (loading && !data) {
    return <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading archive…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
        <p>{GLOBAL_DISCLAIMER}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunOpen(true)}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Run EstateLeadOS
        </button>
        <Link href="/review-queue" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">
          Review Queue
        </Link>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total Archived" value={data.total} />
          <Stat label="Ready for Review" value={data.readyForReview} />
          <Stat label="Missing Documents" value={data.missingDocuments} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Lead Packet Archive</CardTitle></CardHeader>
        <CardContent>
          {!data?.archives?.length ? (
            <p className="text-sm text-slate-400">No archived packets yet. Build a packet from Lead Detail or run the full lead-to-packet workflow.</p>
          ) : (
            <ul className="space-y-3">
              {data.archives.map((archive) => (
                <li key={archive.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-200">
                      {PACKET_TYPE_LABELS[archive.archiveType]} — v{archive.confidenceScore}
                    </p>
                    <p className="text-xs text-slate-500">
                      {archive.countyName}, {archive.stateAbbr} · {new Date(archive.archivedAt).toLocaleString()}
                    </p>
                    <Badge variant="default">{archive.archiveStatus.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openPacket(archive.packetId)} className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">
                      <ExternalLink className="h-3 w-3" /> Open
                    </button>
                    <button type="button" onClick={() => printPacket(archive.packetId, archive.leadId)} className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">
                      <Printer className="h-3 w-3" /> Print
                    </button>
                    <Link href={`/leads/${archive.leadId}`} className="inline-flex items-center gap-1 rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-400">
                      Lead Detail
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {printHtml && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Packet Preview</CardTitle>
            <button type="button" onClick={() => setPrintHtml(null)} className="text-xs text-slate-500">Close</button>
          </CardHeader>
          <CardContent>
            <iframe title="Packet preview" srcDoc={printHtml} className="h-[500px] w-full rounded border border-slate-700 bg-white" />
          </CardContent>
        </Card>
      )}

      <RunEstateLeadOSModal open={runOpen} onClose={() => setRunOpen(false)} onComplete={() => load()} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}
