"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  GOVERNMENT_PROOF_DISCLAIMER,
  REQUIRED_DOCUMENT_STATUS_LABELS,
} from "@/lib/constants/required-packet-items";
import type { RequiredDocument } from "@/lib/types/program";
import type { EvidenceSource } from "@/lib/types/verification";
import { AlertTriangle, CheckSquare, ExternalLink, FileSearch, Link2 } from "lucide-react";

interface RequiredDocumentChecklistProps {
  documents: RequiredDocument[];
  evidenceSources: EvidenceSource[];
  onRefresh?: () => void;
  loading?: boolean;
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  not_started: "default",
  found: "info",
  attached: "success",
  missing: "danger",
  needs_manual_research: "warning",
  needs_upload: "warning",
  needs_review: "warning",
  approved: "success",
  rejected: "danger",
  not_applicable: "default",
};

function nextAction(doc: RequiredDocument): string {
  switch (doc.status) {
    case "missing":
    case "needs_manual_research":
      return doc.whereToLookNext ?? "Research official government source";
    case "needs_upload":
      return "Upload document file";
    case "needs_review":
      return "Complete manual review";
    case "approved":
      return "Approved — ready for packet";
    case "attached":
    case "found":
      return "Review and confirm citation";
    case "not_applicable":
      return "Not required for this lead";
    default:
      return "Run document discovery";
  }
}

export function RequiredDocumentChecklist({
  documents,
  evidenceSources,
  onRefresh,
  loading,
}: RequiredDocumentChecklistProps) {
  const evidenceById = new Map(evidenceSources.map((e) => [e.id, e]));
  const missing = documents.filter((d) =>
    ["missing", "needs_manual_research", "needs_upload", "not_started"].includes(d.status),
  );

  return (
    <Card className="border-[var(--nova-gold-muted)]/30">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="h-4 w-4 text-[var(--nova-gold)]" />
          Required Document Checklist
        </CardTitle>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-sky-600 disabled:opacity-50"
          >
            {loading ? "Discovering…" : "Run Discovery"}
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">{GOVERNMENT_PROOF_DISCLAIMER}</p>

        {missing.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {missing.length} document(s) missing or need manual research — gaps are shown explicitly; EstateLeadOS never
              pretends they exist.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500">
                <th className="pb-2 pr-3 font-medium">Document</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Source</th>
                <th className="pb-2 pr-3 font-medium">Required</th>
                <th className="pb-2 font-medium">Next action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const linked = doc.evidenceSourceId ? evidenceById.get(doc.evidenceSourceId) : null;
                return (
                  <tr key={doc.id} className="border-b border-slate-800/60 align-top">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-200">{doc.documentName}</p>
                      {doc.whyItMatters && (
                        <p className="mt-0.5 text-xs text-slate-500">{doc.whyItMatters}</p>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={STATUS_VARIANT[doc.status] ?? "default"}>
                        {REQUIRED_DOCUMENT_STATUS_LABELS[doc.status]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-400">
                      {doc.sourceName ?? linked?.sourceName ?? "—"}
                      {(doc.sourceUrl ?? linked?.sourceUrl) && (
                        <a
                          href={doc.sourceUrl ?? linked?.sourceUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-sky-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Source URL
                        </a>
                      )}
                      {doc.evidenceSourceId && linked && (
                        <span className="mt-1 flex items-center gap-1 text-slate-500">
                          <Link2 className="h-3 w-3" />
                          Citation [{linked.citationNumber}]
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-[10px] text-slate-500">
                      <p>Packet: {doc.requiredForPacket ? "Yes" : "No"}</p>
                      <p>Attorney: {doc.requiredForAttorneyReview ? "Yes" : "No"}</p>
                      <p>Assignment: {doc.requiredForAssignmentReview ? "Yes" : "No"}</p>
                    </td>
                    <td className="py-3 text-xs text-slate-400">{nextAction(doc)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {documents.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <FileSearch className="h-4 w-4" />
            Run document discovery to find or flag required government proof documents.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
