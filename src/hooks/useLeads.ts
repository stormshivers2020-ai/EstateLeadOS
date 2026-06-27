"use client";

import { useEffect, useState } from "react";
import { isLocalPreviewMode, isSupabaseMode } from "@/lib/config/runtime";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { setClientLeadsCache } from "@/lib/config/session";
import type { FullLeadDetail } from "@/lib/types/crm";

export function useLeads(): { leads: FullLeadDetail[]; loading: boolean } {
  const [leads, setLeads] = useState<FullLeadDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isLocalPreviewMode()) {
        if (!cancelled) {
          const localLeads = getDataProvider().crm.getFullLeads();
          setLeads(localLeads);
          setLoading(false);
        }
        return;
      }
      if (isSupabaseMode()) {
        try {
          const res = await fetch("/api/leads", { credentials: "include" });
          const data = await res.json();
          const loaded = (data.leads ?? []) as import("@/lib/types/crm").FullLeadDetail[];
          if (!cancelled) {
            setLeads(loaded);
            setClientLeadsCache(loaded);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { leads, loading };
}
