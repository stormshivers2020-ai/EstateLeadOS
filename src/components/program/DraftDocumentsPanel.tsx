"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ACQUISITION_PACKET_DISCLAIMER,
  DRAFT_SIGNATURE_REVIEW_LABEL,
  DRAFT_SIGNATURE_STATUS_LABELS,
  type DraftSignatureDocument,
} from "@/lib/types/program";
import { loadDraftDocumentsAction } from "@/lib/services/program/client-program";
import { ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";

interface DraftDocumentsPanelProps {
  leadId: string;
  packetId?: string | null;
}

export function DraftDocumentsPanel({ leadId, packetId }: DraftDocumentsPanelProps) {
  const [documents, setDocuments] = useState<DraftSignatureDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await loadDraftDocumentsAction(leadId, packetId ?? undefined);
      setDocuments(json.documents ?? []);
    } catch {
      setError("Could not load draft documents.");
    } finally {
      setLoading(false);
    }
  }, [leadId, packetId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading draft documents…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
        <p className="font-medium">{DRAFT_SIGNATURE_REVIEW_LABEL}</p>
        <p className="mt-1 text-xs text-amber-200/80">{ACQUISITION_PACKET_DISCLAIMER}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft Documents for Attorney / Title Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">Build an acquisition packet to generate draft documents from lead data.</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded border border-slate-700/50 p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-slate-200">
                    <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                    {doc.documentName}
                  </p>
                  <p className="mt-1 text-xs text-amber-300/90">{DRAFT_SIGNATURE_REVIEW_LABEL}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status: {DRAFT_SIGNATURE_STATUS_LABELS[doc.status]}
                    {doc.missingFields.length > 0 && ` · ${doc.missingFields.length} missing field(s)`}
                  </p>
                  {doc.missingFields.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-xs text-amber-200/80">
                      {doc.missingFields.slice(0, 4).map((f) => (
                        <li key={f}>{f.replace(/_/g, " ")}</li>
                      ))}
                      {doc.missingFields.length > 4 && <li>+{doc.missingFields.length - 4} more</li>}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={doc.missingFields.length ? "warning" : "default"}>{doc.status}</Badge>
                  <button
                    type="button"
                    onClick={() => setPreviewHtml(doc.generatedHtml)}
                    className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-xs text-slate-300"
                  >
                    <ExternalLink className="h-3 w-3" /> Preview
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {previewHtml && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Draft Document Preview</CardTitle>
            <button type="button" onClick={() => setPreviewHtml(null)} className="text-xs text-slate-500">
              Close
            </button>
          </CardHeader>
          <CardContent>
            <iframe
              title="Draft document preview"
              srcDoc={previewHtml}
              className="h-[480px] w-full rounded border border-slate-700 bg-white"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
