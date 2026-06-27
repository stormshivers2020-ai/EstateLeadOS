import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { isSupabaseMode } from "@/lib/config/runtime";
import type { DashboardMetrics } from "@/lib/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (isSupabaseMode()) {
    const { fetchDashboardMetrics } = await import("@/lib/supabase/queries/dashboard");
    return fetchDashboardMetrics();
  }
  return getDataProvider().dashboard.getMetrics();
}
