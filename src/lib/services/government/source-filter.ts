import {
  GOVERNMENT_DOMAIN_PATTERNS,
  MARYLAND_SOURCE_REGISTRY_SEED,
  REJECTED_MARKETPLACE_DOMAINS,
  REJECTED_REGISTRY_SEED,
} from "./constants";
import type { SourceRegistryEntry } from "@/lib/types/government";

function uid(): string {
  return `src-${Math.random().toString(36).slice(2, 9)}`;
}

function withIds(entries: Omit<SourceRegistryEntry, "id" | "createdAt">[]): SourceRegistryEntry[] {
  const now = new Date().toISOString();
  return entries.map((e) => ({ ...e, id: uid(), createdAt: now }));
}

let registryCache: SourceRegistryEntry[] | null = null;

export function getSourceRegistry(): SourceRegistryEntry[] {
  if (!registryCache) {
    registryCache = withIds([...MARYLAND_SOURCE_REGISTRY_SEED, ...REJECTED_REGISTRY_SEED]);
  }
  return registryCache;
}

export function getAllowedGovernmentSources(state?: string, county?: string): SourceRegistryEntry[] {
  return getSourceRegistry().filter((s) => {
    if (!s.isGovernmentSource || !s.allowedForLeadCreation) return false;
    if (state && s.jurisdictionState && s.jurisdictionState !== state) return false;
    if (county && s.jurisdictionCounty && !county.toLowerCase().includes(s.jurisdictionCounty.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export function findRegistryByUrl(url: string): SourceRegistryEntry | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const registry = getSourceRegistry();
    const exact = registry.find((s) => {
      try {
        return new URL(s.baseUrl).hostname.toLowerCase() === hostname;
      } catch {
        return false;
      }
    });
    if (exact) return exact;
    return registry.find((s) => hostname.includes(new URL(s.baseUrl).hostname.replace(/^www\./, ""))) ?? null;
  } catch {
    return null;
  }
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isRejectedMarketplaceDomain(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return REJECTED_MARKETPLACE_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

export function isGovernmentHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (isRejectedMarketplaceDomain(h)) return false;
  return GOVERNMENT_DOMAIN_PATTERNS.some((p) => p.test(h));
}

export interface SourceClassification {
  allowed: boolean;
  isGovernment: boolean;
  trustLevel: SourceRegistryEntry["trustLevel"];
  rejectionReason?: string;
  registryEntry?: SourceRegistryEntry;
}

export function classifySourceUrl(url: string, governmentSourcesOnly = true): SourceClassification {
  const hostname = hostnameFromUrl(url);
  const registryEntry = findRegistryByUrl(url);

  if (registryEntry?.trustLevel === "rejected" || isRejectedMarketplaceDomain(hostname)) {
    return {
      allowed: false,
      isGovernment: false,
      trustLevel: "rejected",
      rejectionReason: `Rejected marketplace or lead-selling source: ${hostname || url}`,
      registryEntry: registryEntry ?? undefined,
    };
  }

  if (registryEntry?.allowedForLeadCreation && registryEntry.isGovernmentSource) {
    return {
      allowed: true,
      isGovernment: true,
      trustLevel: registryEntry.trustLevel,
      registryEntry,
    };
  }

  const govHost = isGovernmentHostname(hostname);
  if (govHost) {
    return {
      allowed: true,
      isGovernment: true,
      trustLevel: "official_secondary",
    };
  }

  if (governmentSourcesOnly) {
    return {
      allowed: false,
      isGovernment: false,
      trustLevel: "rejected",
      rejectionReason: `Non-government source blocked in Government Sources Only mode: ${hostname || url}`,
    };
  }

  return {
    allowed: false,
    isGovernment: false,
    trustLevel: "enrichment",
    rejectionReason: "Source is not an official government record",
  };
}
