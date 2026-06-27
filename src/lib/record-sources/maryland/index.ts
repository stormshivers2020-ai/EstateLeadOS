import type { NormalizedGovernmentRecord } from "../types";
import { getConnectorsForCounty } from "./county-template";
import { parseHitToNormalizedRecord } from "../registry";
import { searchInternet } from "@/lib/services/lead-discovery/internet-search";

export { getConnectorsForCounty, getMarylandCountyBundles, buildCountyConnectorBundle } from "./county-template";
export { MARYLAND_COUNTIES } from "./counties";
export type { NormalizedGovernmentRecord, RecordSourceConnector, CountyConnectorBundle } from "../types";

export async function runCountyConnectors(input: {
  stateAbbr: string;
  countyName: string;
  city?: string;
  maxPerConnector?: number;
}): Promise<{
  records: NormalizedGovernmentRecord[];
  queries: string[];
  sourcesQueried: number;
  manualReviewTasks: Array<{ sourceName: string; reason: string }>;
}> {
  const connectors = getConnectorsForCounty(input.stateAbbr, input.countyName);
  const queries: string[] = [];
  const records: NormalizedGovernmentRecord[] = [];
  const manualReviewTasks: Array<{ sourceName: string; reason: string }> = [];
  const seen = new Set<string>();
  const max = input.maxPerConnector ?? 3;

  for (const connector of connectors) {
    if (connector.mode === "manual_review_only" || connector.requiresManualLogin) {
      manualReviewTasks.push({
        sourceName: connector.sourceName,
        reason: "Source requires manual login — create manual review task instead of automated scrape",
      });
      continue;
    }

    const connectorQueries = connector.buildQueries({
      state: input.stateAbbr,
      county: input.countyName,
      city: input.city,
    });
    queries.push(...connectorQueries);

    for (const query of connectorQueries) {
      const hits = await searchInternet(query, max);
      for (const hit of hits) {
        const key = hit.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const record = parseHitToNormalizedRecord(hit, connector, {
          state: input.stateAbbr,
          county: input.countyName,
        });
        if (record) records.push(record);
      }
    }
  }

  return {
    records: records.sort((a, b) => b.confidence_score - a.confidence_score),
    queries,
    sourcesQueried: connectors.length,
    manualReviewTasks,
  };
}
