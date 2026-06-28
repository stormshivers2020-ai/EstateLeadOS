"use client";

import { useState } from "react";
import type { EvidenceSource } from "@/lib/types/verification";
import { Badge } from "@/components/ui/Badge";
import { APP_NAME, POWERED_BY } from "@/lib/constants/brand";
import { ExternalLink, Camera, Copy, Landmark, Check } from "lucide-react";

interface EvidenceCardProps {
  source: EvidenceSource;
  id?: string;
}

function isOfficialGovernmentSource(source: EvidenceSource): boolean {
  const blob = `${source.sourceType} ${source.sourceName} ${source.sourceUrl ?? ""}`;
  if (/internet_search|zillow|realtor|redfin|trulia|people.?search/i.test(blob)) return false;
  return /\.gov|assessor|probate|estate|deed|recorder|register|court|gis|parcel|tax|sdat|land.?record|government/i.test(
    blob,
  );
}

export function EvidenceCard({ source, id }: EvidenceCardProps) {
  const [copied, setCopied] = useState(false);
  const official = isOfficialGovernmentSource(source);

  async function copyCitation() {
    const text =
      source.formattedCitation
      ?? `[${source.citationNumber ?? "?"}] ${source.sourceName} — ${source.citationLabel ?? source.sourceType} — ${source.sourceUrl ?? ""} — retrieved ${new Date(source.retrievedAt).toLocaleString()}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const jurisdiction =
    source.jurisdictionCounty && source.jurisdictionState
      ? `${source.jurisdictionCounty}, ${source.jurisdictionState}`
      : source.jurisdictionState
        ?? source.matchedFields?.jurisdiction
        ?? source.matchedFields?.county
        ?? "—";

  return (
    <div id={id ?? `evidence-${source.id}`} className="rounded-lg border border-slate-700/50 bg-black/20 p-4 text-sm">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-600">
        {APP_NAME} · Powered by {POWERED_BY}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-200">
            {source.citationNumber != null && `[${source.citationNumber}] `}
            {source.sourceName}
          </p>
          <p className="text-xs text-slate-500">
            {source.sourceType.replace(/_/g, " ")}
            {source.citationLabel ? ` · ${source.citationLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {official ? (
            <Badge variant="success" className="gap-1">
              <Landmark className="h-3 w-3" /> Official source
            </Badge>
          ) : (
            <Badge variant="warning">Not valid lead proof</Badge>
          )}
          <Badge variant="info">{source.confidenceScore}% confidence</Badge>
        </div>
      </div>

      <dl className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt className="text-slate-600">Jurisdiction</dt>
          <dd className="text-slate-300">{jurisdiction}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Retrieved</dt>
          <dd className="text-slate-300">{new Date(source.retrievedAt).toLocaleString()}</dd>
        </div>
      </dl>

      {source.matchedFields && Object.keys(source.matchedFields).length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="text-slate-600">Matched fields: </span>
          {Object.entries(source.matchedFields)
            .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
            .join(" · ")}
        </p>
      )}

      {source.sourceExcerpt && <p className="mt-2 text-slate-400">{source.sourceExcerpt}</p>}

      {source.screenshotUrl && (
        <a
          href={source.screenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded border border-slate-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source.screenshotUrl} alt="Source screenshot" className="max-h-40 w-full object-cover opacity-90" />
        </a>
      )}

      <div className="mobile-action-row mt-3">
        {source.sourceUrl && (
          <a
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-sky-400 hover:border-slate-500 sm:px-2.5 sm:py-1 sm:text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Open Source URL
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
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Citation"}
        </button>
      </div>
    </div>
  );
}
