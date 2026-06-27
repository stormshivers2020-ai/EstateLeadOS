import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { checkUsageLimit } from "@/lib/engines/feature-gate";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { getOrganizationById } from "@/lib/services/admin";

export function getUsageRecords(organizationId?: string) {
  const records = shouldLoadSeedData() ? getDataProvider().platform.getUsageRecords() : [];
  return organizationId ? records.filter((r) => r.organizationId === organizationId) : records;
}

export function getOrganizationUsageSummary(organizationId: string) {
  const org = getOrganizationById(organizationId);
  const records = getUsageRecords(organizationId);

  return records.map((r) => {
    const check = checkUsageLimit(r.count, r.relatedPlanLimit);
    return { ...r, warningLevel: check.warningLevel, warningMessage: check.message };
  });
}

export function isOrganizationOverLimit(organizationId: string, usageType: string): boolean {
  const record = getUsageRecords(organizationId).find((r) => r.usageType === usageType);
  if (!record) return false;
  return checkUsageLimit(record.count, record.relatedPlanLimit).warningLevel === "hard";
}
