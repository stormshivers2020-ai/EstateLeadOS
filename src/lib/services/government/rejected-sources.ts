import { getLocalState, persistLocalState } from "@/lib/local/localStateStore";
import { getSessionContext } from "@/lib/config/session";
import { isSupabaseMode } from "@/lib/config/runtime";
import type { RejectedSourceRecord } from "@/lib/types/government";
import type { InternetSearchHit } from "@/lib/services/lead-discovery/types";
import { classifySourceUrl, hostnameFromUrl } from "./source-filter";
import * as govQueries from "@/lib/supabase/queries/government";

function uid(): string {
  return `rej-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function logRejectedHit(
  hit: InternetSearchHit,
  searchId: string,
  governmentSourcesOnly: boolean
): RejectedSourceRecord | null {
  const classification = classifySourceUrl(hit.url, governmentSourcesOnly);
  if (classification.allowed) return null;

  const session = getSessionContext();
  const record: RejectedSourceRecord = {
    id: uid(),
    organizationId: session.organizationId,
    searchId,
    sourceName: classification.registryEntry?.sourceName ?? hostnameFromUrl(hit.url),
    sourceUrl: hit.url,
    sourceType: classification.registryEntry?.sourceType ?? "web",
    rejectionReason: classification.rejectionReason ?? "Source not allowed for lead creation",
    hostname: hostnameFromUrl(hit.url),
    rawTitle: hit.title,
    rawSnippet: hit.content.slice(0, 300),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseMode()) {
    void govQueries.insertRejectedSource(record);
    return record;
  }

  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    rejectedSources?: RejectedSourceRecord[];
  };
  if (!state.rejectedSources) state.rejectedSources = [];
  state.rejectedSources.unshift(record);
  if (state.rejectedSources.length > 500) state.rejectedSources.length = 500;
  persistLocalState();
  return record;
}

export async function logRejectedHits(
  hits: InternetSearchHit[],
  searchId: string,
  governmentSourcesOnly: boolean
): Promise<RejectedSourceRecord[]> {
  const rejected: RejectedSourceRecord[] = [];
  for (const hit of hits) {
    const r = logRejectedHit(hit, searchId, governmentSourcesOnly);
    if (r) rejected.push(r);
  }
  return rejected;
}

export function getRejectedSources(searchId?: string): RejectedSourceRecord[] {
  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    rejectedSources?: RejectedSourceRecord[];
  };
  const all = state.rejectedSources ?? [];
  if (!searchId) return all;
  return all.filter((r) => r.searchId === searchId);
}

export function isGovernmentSourcesOnlyEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_GOVERNMENT_SOURCES_ONLY === "false") return false;
  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    governmentSourcesOnly?: boolean;
  };
  return state.governmentSourcesOnly ?? true;
}

export function setGovernmentSourcesOnly(enabled: boolean): void {
  const state = getLocalState() as ReturnType<typeof getLocalState> & {
    governmentSourcesOnly?: boolean;
  };
  state.governmentSourcesOnly = enabled;
  persistLocalState();
}
