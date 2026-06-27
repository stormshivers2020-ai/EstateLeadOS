import "server-only";
import type { InternetSearchHit } from "./types";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export function isInternetSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export function buildEstateSearchQueries(input: {
  state: string;
  county: string;
  city?: string;
}): string[] {
  const { state, county, city } = input;
  const place = city ? `${city} ${county} County ${state}` : `${county} County ${state}`;
  return [
    `probate property sale ${place}`,
    `inherited property real estate ${place}`,
    `estate sale home ${place}`,
    `probate listing executor ${place}`,
  ];
}

export async function searchInternet(query: string, maxResults = 8): Promise<InternetSearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Internet lead search is not configured. Add TAVILY_API_KEY to .env.local (free tier at tavily.com)."
    );
  }

  const response = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_answer: false,
      max_results: maxResults,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Internet search failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
  };

  return (payload.results ?? [])
    .filter((r) => r.url && r.title)
    .map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
      score: r.score,
    }));
}

export async function runEstateInternetSearch(input: {
  state: string;
  county: string;
  city?: string;
  maxResultsPerQuery?: number;
}): Promise<{ queries: string[]; hits: InternetSearchHit[] }> {
  const queries = buildEstateSearchQueries(input);
  const maxPerQuery = input.maxResultsPerQuery ?? 6;
  const seen = new Set<string>();
  const hits: InternetSearchHit[] = [];

  for (const query of queries) {
    const batch = await searchInternet(query, maxPerQuery);
    for (const hit of batch) {
      const key = hit.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
    }
  }

  return { queries, hits };
}
