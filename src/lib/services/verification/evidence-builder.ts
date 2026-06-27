import { createHash } from "crypto";
import type { LeadSearchCandidate } from "@/lib/services/lead-discovery/types";
import type {
  ContactCandidate,
  EvidenceSource,
  PersonRoleLabel,
  PersonVerification,
  PropertyMedia,
  RecordHit,
} from "@/lib/types/verification";
import { scoreContactCandidate } from "./contact-scoring";
import { annotateCitations } from "./citation";
import {
  buildSourceScreenshotMedia,
  buildStaticMapMedia,
  buildStreetViewMedia,
} from "./property-media";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function hashExcerpt(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Internet Search";
  }
}

function inferPersonRole(ownerName: string | null, signals: string[]): PersonRoleLabel {
  const blob = `${ownerName ?? ""} ${signals.join(" ")}`.toLowerCase();
  if (/\bexecutor\b/.test(blob)) return "possible_personal_representative";
  if (/\bheir\b/.test(blob)) return "possible_heir";
  if (/estate of/.test(blob)) return "possible_interested_person";
  return "needs_verification";
}

function extractMailingAddress(snippet: string): string | null {
  const poBox = snippet.match(/\bP\.?O\.?\s*Box\s+\d+[\w\s,.'-]*/i);
  if (poBox) return poBox[0].trim();
  const address = snippet.match(
    /\d{1,6}\s+[\w\s.'#-]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way|Ct|Court)\b[^.]{0,40}/i
  );
  return address?.[0]?.trim() ?? null;
}

function maybeScreenshotUrl(sourceUrl: string): string | null {
  const api = process.env.SCREENSHOT_CAPTURE_URL;
  if (!api) return null;
  return `${api}${api.includes("?") ? "&" : "?"}url=${encodeURIComponent(sourceUrl)}`;
}

export interface BuiltVerificationEntities {
  recordHit: RecordHit;
  evidenceSources: EvidenceSource[];
  persons: PersonVerification[];
  contactCandidates: ContactCandidate[];
  propertyMedia: PropertyMedia[];
}

export function buildVerificationFromCandidate(
  leadId: string,
  organizationId: string,
  candidate: LeadSearchCandidate,
  searchId: string
): BuiltVerificationEntities {
  const now = new Date().toISOString();
  const host = hostnameFromUrl(candidate.sourceUrl);
  const screenshotUrl = maybeScreenshotUrl(candidate.sourceUrl);

  const recordHit: RecordHit = {
    id: uid("rh"),
    organizationId,
    leadId,
    searchId,
    sourceName: host,
    sourceType: "internet_search",
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.sourceTitle,
    rawSnippet: candidate.snippet,
    matchedFields: {
      property_address: candidate.propertyAddress,
      owner_name: candidate.ownerName ?? "",
      state: candidate.state,
      county: candidate.county,
    },
    confidenceScore: candidate.dataConfidenceScore,
    createdAt: now,
  };

  const evidenceSources: EvidenceSource[] = [
    {
      id: uid("ev"),
      organizationId,
      leadId,
      recordHitId: recordHit.id,
      sourceName: host,
      sourceType: candidate.leadType.includes("probate") ? "probate_estate" : "internet_search",
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      citationLabel: candidate.leadType.includes("probate") ? "Estate case record" : "Web search hit",
      retrievedAt: now,
      screenshotUrl,
      sourceExcerpt: candidate.snippet,
      sourceHash: hashExcerpt(candidate.snippet),
      confidenceScore: candidate.dataConfidenceScore,
      createdAt: now,
    },
  ];

  for (const signal of candidate.signals.slice(0, 3)) {
    evidenceSources.push({
      id: uid("ev"),
      organizationId,
      leadId,
      recordHitId: recordHit.id,
      sourceName: host,
      sourceType: "signal_match",
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      citationLabel: signal,
      retrievedAt: now,
      screenshotUrl: null,
      sourceExcerpt: signal,
      sourceHash: hashExcerpt(signal),
      confidenceScore: Math.min(90, candidate.dataConfidenceScore + 5),
      createdAt: now,
    });
  }

  const persons: PersonVerification[] = [];
  if (candidate.ownerName) {
    const roleLabel = inferPersonRole(candidate.ownerName, candidate.signals);
    persons.push({
      id: uid("pv"),
      organizationId,
      leadId,
      personName: candidate.ownerName,
      roleLabel,
      connectionRationale: `Identified from search result signals: ${candidate.signals.slice(0, 2).join("; ")}. EstateLeadOS labels this as "${roleLabel.replace(/_/g, " ")}" — not a confirmed heir.`,
      confidenceScore: Math.min(75, candidate.dataConfidenceScore),
      verificationStatus: "needs_verification",
      approvedBy: null,
      approvedAt: null,
      rejectedAt: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const contactCandidates: ContactCandidate[] = [];
  const mailing = extractMailingAddress(candidate.snippet);
  if (mailing && persons[0]) {
    const scored = scoreContactCandidate({
      personName: persons[0].personName,
      contactType: "mailing_address",
      contactValue: mailing,
      sourceType: evidenceSources[0].sourceType,
      sourceName: evidenceSources[0].sourceName,
      matchedPersonName: persons[0].personName,
      hasEstateRole: /estate|probate|executor|heir/i.test(candidate.snippet),
      matchedMailingAddress: true,
    });
    contactCandidates.push({
      id: uid("cc"),
      organizationId,
      leadId,
      personVerificationId: persons[0].id,
      personName: persons[0].personName,
      contactType: "mailing_address",
      contactValue: mailing,
      sourceName: evidenceSources[0].sourceName,
      sourceUrl: candidate.sourceUrl,
      confidenceScore: scored.confidenceScore,
      verificationStatus: scored.verificationStatus,
      lastVerifiedAt: null,
      notes: scored.rationale,
      createdAt: now,
    });
  }

  const propertyMedia: PropertyMedia[] = [
    buildStaticMapMedia(leadId, organizationId, candidate.propertyAddress),
  ];
  const streetView = buildStreetViewMedia(leadId, organizationId, candidate.propertyAddress);
  if (streetView) propertyMedia.push(streetView);
  if (screenshotUrl) {
    propertyMedia.push(
      buildSourceScreenshotMedia(leadId, organizationId, screenshotUrl, host, candidate.sourceUrl)
    );
  }

  return {
    recordHit,
    evidenceSources: annotateCitations(evidenceSources),
    persons,
    contactCandidates,
    propertyMedia,
  };
}
