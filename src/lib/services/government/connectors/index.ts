import "server-only";

import type { GovernmentNormalizedRecord } from "@/lib/types/government";
import type { InternetSearchHit } from "@/lib/services/lead-discovery/types";
import { searchInternet, isInternetSearchConfigured } from "@/lib/services/lead-discovery/internet-search";
import { buildConnectorQueries, getConnectorsForMarket, hitToGovernmentRecord } from "../record-parser";

export { isInternetSearchConfigured as isGovernmentSearchConfigured };

export async function runGovernmentConnectors(input: {
  state: string;
  county: string;
  city?: string;
  maxResultsPerConnector?: number;
}): Promise<{
  records: GovernmentNormalizedRecord[];
  queries: string[];
  hitsScanned: number;
  connectorsRun: number;
}> {
  const connectors = getConnectorsForMarket(input.state, input.county);
  const queries: string[] = [];
  const seen = new Set<string>();
  const records: GovernmentNormalizedRecord[] = [];
  let hitsScanned = 0;
  const maxPer = input.maxResultsPerConnector ?? 4;

  for (const connector of connectors) {
    const connectorQueries = buildConnectorQueries(
      { sourceName: connector.sourceName, baseUrl: connector.baseUrl, sourceType: connector.sourceType },
      { state: input.state, county: input.county, city: input.city }
    );
    queries.push(...connectorQueries);

    for (const query of connectorQueries) {
      const hits = await searchInternet(query, maxPer);
      hitsScanned += hits.length;

      for (const hit of hits) {
        const key = hit.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const record = hitToGovernmentRecord(
          hit as InternetSearchHit,
          { sourceName: connector.sourceName, sourceType: connector.sourceType, registryId: connector.id },
          { state: input.state, county: input.county }
        );
        if (record) records.push(record);
      }
    }
  }

  return {
    records: records.sort((a, b) => b.confidenceScore - a.confidenceScore),
    queries,
    hitsScanned,
    connectorsRun: connectors.length,
  };
}
