import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { insertPendingInternetLead } from "@/lib/supabase/queries/leads";
import { runEstateInternetSearch, isInternetSearchConfigured } from "./internet-search";
import { parseSearchHitsToCandidates } from "./parse-candidates";
import { queuePendingLocally } from "./approval";
import { persistVerificationForCandidateAsync } from "@/lib/services/verification";
import type { InternetLeadDiscoveryResult, InternetLeadSearchInput } from "./types";

export type { InternetLeadDiscoveryResult, InternetLeadSearchInput, PendingInternetLead } from "./types";
export {
  isInternetSearchConfigured,
  buildEstateSearchQueries,
} from "./internet-search";
export {
  getPendingInternetLeads,
  approveInternetLead,
  rejectInternetLead,
} from "./approval";

function sourceLabel(url: string): string {
  try {
    return `Internet Search — Pending Approval (${new URL(url).hostname})`;
  } catch {
    return "Internet Search — Pending Approval";
  }
}

async function queueCandidatesSupabase(
  candidates: import("./types").LeadSearchCandidate[],
  searchId: string
): Promise<Array<{ id: string; propertyAddress: string; ownerName: string; sourceUrl: string }>> {
  const queued: Array<{ id: string; propertyAddress: string; ownerName: string; sourceUrl: string }> = [];

  for (const candidate of candidates) {
    const lead = await insertPendingInternetLead({
      propertyAddress: candidate.propertyAddress,
      ownerName: candidate.ownerName ?? undefined,
      state: candidate.state,
      county: candidate.county,
      city: candidate.city ?? undefined,
      leadType: candidate.leadType,
      sourceName: sourceLabel(candidate.sourceUrl),
      sourceUrl: candidate.sourceUrl,
      estateLeadScore: candidate.estateLeadScore,
      dealPotentialScore: candidate.dealPotentialScore,
      complianceRiskScore: candidate.complianceRiskScore,
      dataConfidenceScore: candidate.dataConfidenceScore,
    });

    if (!lead) continue;
    await persistVerificationForCandidateAsync(lead.id, candidate, searchId);
    queued.push({
      id: lead.id,
      propertyAddress: lead.propertyAddress,
      ownerName: lead.ownerName,
      sourceUrl: candidate.sourceUrl,
    });
  }

  return queued;
}

export async function discoverLeadsFromInternet(
  input: InternetLeadSearchInput
): Promise<InternetLeadDiscoveryResult> {
  const state = input.state.trim().toUpperCase();
  const county = input.county.trim();
  if (!state || state.length !== 2) {
    throw new Error("A valid two-letter state code is required (e.g. TX).");
  }
  if (!county) {
    throw new Error("County is required for internet lead search.");
  }

  const searchId = `web-search-${Date.now()}`;
  const { queries, hits } = await runEstateInternetSearch({
    state,
    county,
    city: input.city?.trim(),
    maxResultsPerQuery: Math.min(8, Math.ceil((input.maxResults ?? 12) / 3)),
  });

  const candidates = parseSearchHitsToCandidates(hits, {
    state,
    county,
    city: input.city?.trim(),
  }).slice(0, input.maxResults ?? 12);

  if (candidates.length === 0) {
    return {
      searchId,
      queries,
      hitsScanned: hits.length,
      candidatesFound: 0,
      pendingQueued: 0,
      duplicatesSkipped: 0,
      errors: 0,
      pending: [],
      warnings: [
        hits.length === 0
          ? "No search results returned for this market. Try a different county or broaden the search."
          : "Results were found but none matched estate/probate signals. Try another market.",
      ],
    };
  }

  const session = getSessionContext();
  let pending: Array<{ id: string; propertyAddress: string; ownerName: string; sourceUrl: string }> = [];
  let duplicatesSkipped = 0;

  if (isSupabaseMode()) {
    pending = await queueCandidatesSupabase(candidates, searchId);
    duplicatesSkipped = candidates.length - pending.length;
  } else {
    const before = candidates.length;
    const queued = queuePendingLocally(candidates, searchId);
    for (const p of queued) {
      await persistVerificationForCandidateAsync(p.id, p.candidate, searchId);
    }
    pending = queued.map((p) => ({
      id: p.id,
      propertyAddress: p.candidate.propertyAddress,
      ownerName: p.candidate.ownerName ?? "Unknown",
      sourceUrl: p.candidate.sourceUrl,
    }));
    duplicatesSkipped = before - queued.length;
  }

  appendPlatformAudit({
    eventType: "internet_lead_search",
    eventDescription: `Internet search ${searchId}: ${pending.length} leads queued for approval`,
    relatedModule: "lead_discovery",
    relatedRecordId: searchId,
    organizationId: session.organizationId,
  });

  return {
    searchId,
    queries,
    hitsScanned: hits.length,
    candidatesFound: candidates.length,
    pendingQueued: pending.length,
    duplicatesSkipped,
    errors: candidates.length - pending.length - duplicatesSkipped,
    pending,
    warnings: [
      `${pending.length} lead(s) are waiting for your approval — they will not appear in Lead Feed until approved.`,
      "Review each source URL before approving. Reject anything that does not look like a valid estate lead.",
    ],
  };
}

export const leadDiscoveryService = {
  id: "lead-discovery",
  status: "active" as const,
  description: "Internet search lead discovery with operator approval gate",
  discoverLeadsFromInternet,
  isConfigured: isInternetSearchConfigured,
};
