import { appendPlatformAudit } from "@/lib/local/localAudit";
import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import { insertPendingInternetLead } from "@/lib/supabase/queries/leads";
import { updateLeadGovernmentStatus } from "@/lib/supabase/queries/government";
import { runGovernmentConnectors, isGovernmentSearchConfigured } from "@/lib/services/government/connectors";
import { governmentRecordsToCandidates } from "@/lib/services/government/candidate-mapper";
import {
  isGovernmentSourcesOnlyEnabled,
  logRejectedHits,
} from "@/lib/services/government/rejected-sources";
import { runEstateInternetSearch } from "./internet-search";
import { parseSearchHitsToCandidates } from "./parse-candidates";
import { classifySourceUrl } from "@/lib/services/government/source-filter";
import { queuePendingLocally } from "./approval";
import { persistVerificationForCandidateAsync } from "@/lib/services/verification";
import type { InternetLeadDiscoveryResult, InternetLeadSearchInput } from "./types";

export type { InternetLeadDiscoveryResult, InternetLeadSearchInput, PendingInternetLead } from "./types";
export { isGovernmentSearchConfigured as isInternetSearchConfigured } from "@/lib/services/government/connectors";
export {
  getPendingInternetLeads,
  approveInternetLead,
  rejectInternetLead,
} from "./approval";

function govSourceLabel(candidate: import("./types").LeadSearchCandidate): string {
  const name = candidate.governmentRecord?.sourceName ?? "Government Record";
  return `Government Source — ${name}`;
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
      sourceName: govSourceLabel(candidate),
      sourceUrl: candidate.sourceUrl,
      estateLeadScore: candidate.estateLeadScore,
      dealPotentialScore: candidate.dealPotentialScore,
      complianceRiskScore: candidate.complianceRiskScore,
      dataConfidenceScore: candidate.dataConfidenceScore,
    });

    if (!lead) continue;
    if (candidate.governmentVerificationStatus && isSupabaseMode()) {
      await updateLeadGovernmentStatus(lead.id, candidate.governmentVerificationStatus);
    }
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
    throw new Error("A valid two-letter state code is required (e.g. MD).");
  }
  if (!county) {
    throw new Error("County is required for government record search.");
  }

  const governmentSourcesOnly = input.governmentSourcesOnly ?? isGovernmentSourcesOnlyEnabled();
  const searchId = `gov-search-${Date.now()}`;

  let queries: string[] = [];
  let hitsScanned = 0;
  let connectorsRun = 0;
  let rejectedCount = 0;
  let candidates: import("./types").LeadSearchCandidate[] = [];

  if (governmentSourcesOnly) {
    const connectorResult = await runGovernmentConnectors({
      state,
      county,
      city: input.city?.trim(),
      maxResultsPerConnector: 4,
    });
    queries = connectorResult.queries;
    hitsScanned = connectorResult.hitsScanned;
    connectorsRun = connectorResult.connectorsRun;

    candidates = governmentRecordsToCandidates(connectorResult.records, {
      state,
      county,
      city: input.city?.trim(),
    }).slice(0, input.maxResults ?? 12);

    if (candidates.length === 0 && state !== "MD") {
      const fallback = await runEstateInternetSearch({
        state,
        county,
        city: input.city?.trim(),
        maxResultsPerQuery: 4,
      });
      hitsScanned += fallback.hits.length;
      queries.push(...fallback.queries.map((q) => `site:.gov ${q}`));

      const rejected = await logRejectedHits(
        fallback.hits.filter((h) => !classifySourceUrl(h.url, true).allowed),
        searchId,
        true
      );
      rejectedCount += rejected.length;

      const govHits = fallback.hits.filter((h) => classifySourceUrl(h.url, true).allowed);
      candidates = parseSearchHitsToCandidates(govHits, { state, county, city: input.city?.trim() })
        .map((c) => ({ ...c, isGovernmentSource: true, governmentVerificationStatus: "government_property_match" as const }))
        .slice(0, input.maxResults ?? 12);
    }
  } else {
    const { queries: webQueries, hits } = await runEstateInternetSearch({
      state,
      county,
      city: input.city?.trim(),
      maxResultsPerQuery: 6,
    });
    queries = webQueries;
    hitsScanned = hits.length;

    const rejected = await logRejectedHits(
      hits.filter((h) => !classifySourceUrl(h.url, false).allowed),
      searchId,
      false
    );
    rejectedCount = rejected.length;

    const allowed = hits.filter((h) => classifySourceUrl(h.url, false).allowed);
    candidates = parseSearchHitsToCandidates(allowed, { state, county, city: input.city?.trim() }).slice(
      0,
      input.maxResults ?? 12
    );
  }

  if (candidates.length === 0) {
    return {
      searchId,
      queries,
      hitsScanned,
      candidatesFound: 0,
      pendingQueued: 0,
      duplicatesSkipped: 0,
      rejectedSources: rejectedCount,
      connectorsRun,
      governmentSourcesOnly,
      errors: 0,
      pending: [],
      warnings: [
        governmentSourcesOnly
          ? "No official government records matched this market. EstateLeadOS does not create leads from Zillow, Realtor.com, or other marketplaces."
          : "No qualifying records found. Enable Government Sources Only to restrict to official records.",
        rejectedCount > 0
          ? `${rejectedCount} non-government source(s) were rejected and logged for audit.`
          : "Try Maryland/Harford connectors or verify Tavily can reach .gov domains.",
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
    eventType: "government_lead_search",
    eventDescription: `Government search ${searchId}: ${pending.length} leads queued, ${rejectedCount} sources rejected`,
    relatedModule: "lead_discovery",
    relatedRecordId: searchId,
    organizationId: session.organizationId,
  });

  return {
    searchId,
    queries,
    hitsScanned,
    candidatesFound: candidates.length,
    pendingQueued: pending.length,
    duplicatesSkipped,
    rejectedSources: rejectedCount,
    connectorsRun,
    governmentSourcesOnly,
    errors: candidates.length - pending.length - duplicatesSkipped,
    pending,
    warnings: [
      governmentSourcesOnly
        ? "Government Sources Only is ON — only official public records can create leads."
        : "Government Sources Only is OFF — marketplace pages may appear. Turn ON for production.",
      `${pending.length} lead(s) await approval with source citations and proof chain.`,
      rejectedCount > 0 ? `${rejectedCount} rejected source(s) saved to audit log.` : "",
    ].filter(Boolean),
  };
}

export const leadDiscoveryService = {
  id: "lead-discovery",
  status: "active" as const,
  description: "Government-record lead discovery with operator approval gate",
  discoverLeadsFromInternet,
  isConfigured: isGovernmentSearchConfigured,
};
