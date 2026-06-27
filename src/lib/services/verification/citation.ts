import type { EvidenceSource } from "@/lib/types/verification";

function formatRetrievedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatEvidenceCitation(source: EvidenceSource, index: number): string {
  const label = source.citationLabel ?? source.sourceTitle ?? "Record";
  const retrieved = formatRetrievedAt(source.retrievedAt);
  const parts = [
    `[${index}] ${source.sourceName} — ${label} — retrieved ${retrieved}`,
  ];
  if (source.sourceExcerpt) {
    parts.push(`Excerpt: ${source.sourceExcerpt.slice(0, 200)}`);
  }
  if (source.confidenceScore > 0) {
    parts.push(`Confidence: ${source.confidenceScore}%`);
  }
  if (source.screenshotUrl) {
    parts.push(`Screenshot: ${source.screenshotUrl}`);
  }
  if (source.sourceUrl) {
    parts.push(`URL: ${source.sourceUrl}`);
  }
  return parts.join("\n");
}

export function annotateCitations(sources: EvidenceSource[]): EvidenceSource[] {
  return sources.map((s, i) => ({
    ...s,
    citationNumber: i + 1,
    formattedCitation: formatEvidenceCitation(s, i + 1),
  }));
}
