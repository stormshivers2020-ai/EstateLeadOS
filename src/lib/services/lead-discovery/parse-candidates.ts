import type { InternetSearchHit, LeadSearchCandidate } from "./types";

const ADDRESS_PATTERN =
  /\d{1,6}\s+[\w\s.'#-]+(?:\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Ct|Court|Pl|Place|Cir|Circle)\b)[,\s]+[\w\s.'-]+,?\s*[A-Z]{2}\b(?:\s+\d{5}(?:-\d{4})?)?/i;

const ESTATE_OWNER_PATTERN =
  /(?:estate of|probate of|in re:?\s*(?:the\s+)?estate of)\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i;

const KEYWORD_SIGNALS: Array<{ pattern: RegExp; signal: string; weight: number }> = [
  { pattern: /\bprobate\b/i, signal: "Probate keyword in search result", weight: 18 },
  { pattern: /\binherited\b/i, signal: "Inherited property keyword", weight: 16 },
  { pattern: /\bestate (?:sale|transfer|property)\b/i, signal: "Estate transfer language", weight: 14 },
  { pattern: /\bexecutor\b/i, signal: "Executor mentioned", weight: 12 },
  { pattern: /\bheir\b/i, signal: "Heir mentioned", weight: 10 },
  { pattern: /\bvacant\b/i, signal: "Vacancy signal", weight: 8 },
  { pattern: /\bdeceased\b/i, signal: "Deceased owner reference", weight: 10 },
  { pattern: /\bfor sale\b/i, signal: "Active sale listing", weight: 6 },
];

function extractAddress(text: string, fallbackState: string): string | null {
  const match = text.match(ADDRESS_PATTERN);
  if (match) return match[0].replace(/\s+/g, " ").trim();

  const streetOnly = text.match(
    /\d{1,6}\s+[\w\s.'#-]+(?:\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way|Ct|Court)\b)/i
  );
  if (streetOnly) {
    return `${streetOnly[0].trim()}, ${fallbackState}`;
  }
  return null;
}

function extractOwner(text: string): string | null {
  const estate = text.match(ESTATE_OWNER_PATTERN);
  if (estate?.[1]) return `Estate of ${estate[1].trim()}`;
  return null;
}

function classifyLeadType(text: string): string {
  if (/\bprobate\b/i.test(text)) return "possible_probate_lead";
  if (/\binherited\b/i.test(text)) return "possible_inherited_property";
  if (/\bestate\b/i.test(text)) return "estate_transfer_lead";
  return "needs_manual_review";
}

function scoreFromSignals(signals: string[], hasAddress: boolean): {
  estateLeadScore: number;
  dealPotentialScore: number;
  complianceRiskScore: number;
  dataConfidenceScore: number;
} {
  const base = 38 + signals.length * 7;
  const estateLeadScore = Math.min(88, base + (hasAddress ? 12 : 0));
  const dealPotentialScore = Math.min(82, 32 + signals.length * 6 + (hasAddress ? 8 : 0));
  const complianceRiskScore = Math.min(72, 30 + (signals.some((s) => s.includes("Probate")) ? 18 : 8));
  const dataConfidenceScore = Math.min(75, hasAddress ? 58 + signals.length * 3 : 38 + signals.length * 2);
  return { estateLeadScore, dealPotentialScore, complianceRiskScore, dataConfidenceScore };
}

export function parseSearchHitsToCandidates(
  hits: InternetSearchHit[],
  market: { state: string; county: string; city?: string }
): LeadSearchCandidate[] {
  const candidates: LeadSearchCandidate[] = [];
  const seenAddresses = new Set<string>();

  for (const hit of hits) {
    const blob = `${hit.title}. ${hit.content}`;
    const signals = KEYWORD_SIGNALS.filter((k) => k.pattern.test(blob)).map((k) => k.signal);
    if (signals.length === 0) continue;

    const address =
      extractAddress(blob, market.state) ??
      (hit.title.length < 120 ? hit.title : `Property lead — ${market.county}, ${market.state}`);

    const normalizedAddress = address.toLowerCase();
    if (seenAddresses.has(normalizedAddress)) continue;
    seenAddresses.add(normalizedAddress);

    const ownerName = extractOwner(blob);
    const scores = scoreFromSignals(signals, Boolean(extractAddress(blob, market.state)));

    candidates.push({
      propertyAddress: address,
      ownerName,
      state: market.state,
      county: market.county,
      city: market.city ?? null,
      leadType: classifyLeadType(blob),
      sourceUrl: hit.url,
      sourceTitle: hit.title,
      snippet: hit.content.slice(0, 280),
      ...scores,
      signals,
    });
  }

  return candidates.sort((a, b) => b.estateLeadScore - a.estateLeadScore);
}
