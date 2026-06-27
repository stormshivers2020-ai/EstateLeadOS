"use client";

import type { EvidenceSource } from "@/lib/types/verification";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Camera, Copy } from "lucide-react";

interface EvidenceCardProps {
  source: EvidenceSource;
}

export function EvidenceCard({ source }: EvidenceCardProps) {
  async function copyCitation() {
    const text = source.formattedCitation ?? `${source.sourceName} — ${source.citationLabel}`;
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="rounded-lg border border-slate-700/50 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-200">
            {source.citationNumber != null && `[${source.citationNumber}] `}
            {source.sourceName}
          </p>
          <p className="text-xs text-slate-500">
            {source.sourceType.replace(/_/g, " ")} — {source.citationLabel}
          </p>
        </div>
        <Badge variant="info">{source.confidenceScore}%</Badge>
      </div>

      {source.sourceExcerpt && (
        <p className="mt-2 text-slate-400">{source.sourceExcerpt}</p>
      )}

      <p className="mt-1 text-xs text-slate-500">
        Retrieved {new Date(source.retrievedAt).toLocaleString()}
      </p>

      <div className="mobile-action-row mt-3">
        {source.sourceUrl && (
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-sky-400 hover:border-slate-500 sm:px-2.5 sm:py-1 sm:text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Open Source
          </a>
        )}
        {source.screenshotUrl && (
          <a
            href={source.screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 sm:px-2.5 sm:py-1 sm:text-xs"
          >
            <Camera className="h-3 w-3" />
            View Screenshot
          </a>
        )}
        <button
          type="button"
          onClick={copyCitation}
          className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 sm:px-2.5 sm:py-1 sm:text-xs"
        >
          <Copy className="h-3 w-3" />
          Copy Citation
        </button>
      </div>
    </div>
  );
}
