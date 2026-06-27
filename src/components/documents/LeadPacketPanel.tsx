"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ReadinessBadge } from "./DocumentBadges";
import {
  getDocumentsForLead,
  getLeadPacket,
  getUploadedDocuments,
  getAttorneyReviewQueue,
  getStarterTemplates,
  runDocumentGeneration,
} from "@/lib/services/documents";
import type { FullLeadDetail } from "@/lib/types/crm";
import { FileText, Upload, AlertTriangle, RefreshCw, Package } from "lucide-react";
import { useState } from "react";

interface LeadPacketPanelProps {
  lead: FullLeadDetail;
  isDemo: boolean;
}

const PACKET_SECTIONS = [
  "Lead Summary", "Property Data", "Owner / Heir Data", "Source Records",
  "Lead Signals", "Score Breakdown", "Compliance Checklist",
  "Required Equipment Checklist Summary", "Required Document Checklist",
  "Communication Log", "Outreach History", "Offer Worksheet Placeholder",
  "Uploaded Documents", "Generated Documents", "Signed Acknowledgements",
  "Attorney Review Notes", "Deal Memo", "Audit Trail Summary",
];

export function LeadPacketPanel({ lead, isDemo }: LeadPacketPanelProps) {
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const packet = isDemo ? getLeadPacket(lead.id) : null;
  const docs = isDemo ? getDocumentsForLead(lead.id) : [];
  const uploads = isDemo ? getUploadedDocuments(lead.id) : [];
  const attorneyItems = isDemo ? getAttorneyReviewQueue().filter((a) => a.leadId === lead.id) : [];
  const templates = getStarterTemplates();

  const handleGenerate = (templateId: string) => {
    const result = runDocumentGeneration({
      templateId,
      leadId: lead.id,
      dealType: packet?.dealType ?? "direct_purchase",
      workflowStage: lead.pipelineStage,
    });
    if (result) setGeneratedPreview(result.content.slice(0, 500) + "...");
  };

  if (!isDemo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-sky-400" />
            Lead Document Packet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            No document packet yet. Generate documents from State Deal Kit or SCS Nova templates.
          </p>
          <Link href="/state-deal-kits" className="mt-2 inline-block text-sm text-sky-400 hover:underline">
            Open State Deal Kit →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-sky-400" />
            Lead Document Packet
          </CardTitle>
          {packet && <ReadinessBadge score={packet.readinessScore} band={packet.readinessBand} />}
        </div>
        <p className="text-xs text-slate-500">
          Document Workflow Readiness — not legal compliance. Missing pieces shown below.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {packet && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant={packet.packetStatus === "ready_for_review" ? "success" : "warning"}>
                {packet.packetStatus.replace(/_/g, " ")}
              </Badge>
              <Badge variant="info">{packet.dealType.replace(/_/g, " ")}</Badge>
            </div>

            {packet.missingDocuments.length > 0 && (
              <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2">
                <p className="flex items-center gap-1 text-xs font-medium text-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Missing Documents ({packet.missingDocuments.length})
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-300/80">
                  {packet.missingDocuments.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Documents list */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Documents ({docs.length})</p>
          <div className="space-y-1">
            {docs.map((d) => (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                className="flex items-center justify-between rounded border border-slate-800 px-3 py-2 text-sm hover:border-sky-700/50"
              >
                <span className="text-slate-300">{d.documentName}</span>
                <span className="text-xs text-slate-500">{d.status.replace(/_/g, " ")}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Uploads */}
        {uploads.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Upload className="h-3 w-3" /> Uploaded ({uploads.length})
            </p>
            {uploads.map((u) => (
              <div key={u.id} className="text-xs text-slate-400">{u.fileName} ({u.fileType})</div>
            ))}
          </div>
        )}

        {/* Attorney review */}
        {attorneyItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Attorney Review Items</p>
            {attorneyItems.map((a) => (
              <div key={a.id} className="text-xs text-amber-300">{a.documentName}: {a.reviewReason}</div>
            ))}
          </div>
        )}

        {/* Generate quick action */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Quick Generate</p>
          <div className="flex flex-wrap gap-2">
            {templates.slice(0, 4).map((t) => (
              <button
                key={t.id}
                onClick={() => handleGenerate(t.id)}
                className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-sky-600"
              >
                <FileText className="mr-1 inline h-3 w-3" />
                {t.templateName}
              </button>
            ))}
          </div>
          {generatedPreview && (
            <pre className="mt-2 max-h-32 overflow-auto rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400">
              {generatedPreview}
            </pre>
          )}
        </div>

        {/* Packet sections */}
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500">Packet sections ({PACKET_SECTIONS.length})</summary>
          <ul className="mt-2 list-inside list-disc text-slate-600">
            {PACKET_SECTIONS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>

        <div className="flex flex-wrap gap-2 pt-2">
          <button className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-600">
            <RefreshCw className="mr-1 inline h-3 w-3" /> Refresh Packet
          </button>
          <button className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-600">
            Export Packet (placeholder)
          </button>
          <Link href="/documents" className="rounded border border-sky-700/50 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900/20">
            Open Document Center →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
