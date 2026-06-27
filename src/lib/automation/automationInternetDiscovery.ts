import type { InternetLeadDiscoveryResult } from "@/lib/services/lead-discovery/types";

export async function searchInternetLeadsViaApi(market: {
  state: string;
  county: string;
  city?: string;
  maxResults?: number;
}): Promise<InternetLeadDiscoveryResult & { error?: string }> {
  const res = await fetch("/api/leads/discover", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(market),
  });
  const data = (await res.json()) as InternetLeadDiscoveryResult & { error?: string };
  if (!res.ok) {
    return { ...data, error: data.error ?? "Internet lead search failed" };
  }
  return data;
}

export async function fetchPendingLeadCount(): Promise<number> {
  const res = await fetch("/api/leads/pending", { credentials: "include" });
  if (!res.ok) return 0;
  const data = (await res.json()) as { count?: number };
  return data.count ?? 0;
}
