import type { MarketLicense } from "@/lib/types/platform";
import { MARKET_ACCESS_MESSAGE } from "@/lib/types/platform";

const ACTIVE_STATUSES = new Set(["active", "trial"]);

export function isMarketLicensed(
  licenses: MarketLicense[],
  organizationId: string,
  state: string,
  county?: string | null
): { allowed: boolean; message: string; license: MarketLicense | null } {
  const orgLicenses = licenses.filter(
    (l) => l.organizationId === organizationId && ACTIVE_STATUSES.has(l.status)
  );

  if (orgLicenses.length === 0) {
    return { allowed: false, message: MARKET_ACCESS_MESSAGE, license: null };
  }

  const stateLicense = orgLicenses.find(
    (l) => l.state === state && !l.county && l.licenseType === "state_license"
  );
  if (stateLicense) return { allowed: true, message: "", license: stateLicense };

  if (county) {
    const countyLicense = orgLicenses.find(
      (l) => l.state === state && l.county?.toLowerCase() === county.toLowerCase()
    );
    if (countyLicense) return { allowed: true, message: "", license: countyLicense };
  }

  const multiCounty = orgLicenses.find(
    (l) => l.state === state && l.licenseType === "multi_county_license"
  );
  if (multiCounty) return { allowed: true, message: "", license: multiCounty };

  const researchOnly = orgLicenses.find(
    (l) => l.state === state && l.status === "research_only"
  );
  if (researchOnly) {
    return {
      allowed: false,
      message: "Research-only access — automated connectors disabled for this market.",
      license: researchOnly,
    };
  }

  return { allowed: false, message: MARKET_ACCESS_MESSAGE, license: null };
}

export function hasDataAutomationAccess(license: MarketLicense | null): boolean {
  if (!license) return false;
  if (license.status === "research_only" || license.status === "manual_upload_only") return false;
  return license.dataAutomationAccess;
}
