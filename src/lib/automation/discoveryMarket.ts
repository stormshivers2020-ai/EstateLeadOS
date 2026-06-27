const STORAGE_KEY = "nova_discovery_market";

export interface DiscoveryMarket {
  state: string;
  county: string;
  city?: string;
}

export function saveDiscoveryMarket(market: DiscoveryMarket): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(market));
  } catch {
    /* ignore */
  }
}

export function getDiscoveryMarket(): DiscoveryMarket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoveryMarket;
    if (!parsed.state || !parsed.county) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const DEFAULT_DISCOVERY_MARKET: DiscoveryMarket = {
  state: "TX",
  county: "Harris",
};

export function resolveDiscoveryMarket(override?: Partial<DiscoveryMarket>): DiscoveryMarket {
  const stored = getDiscoveryMarket();
  return {
    state: (override?.state ?? stored?.state ?? DEFAULT_DISCOVERY_MARKET.state).toUpperCase(),
    county: override?.county ?? stored?.county ?? DEFAULT_DISCOVERY_MARKET.county,
    city: override?.city ?? stored?.city,
  };
}
