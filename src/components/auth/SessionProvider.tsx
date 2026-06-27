"use client";

import { useEffect, type ReactNode } from "react";
import { SCS_NOVA_OPERATOR_SESSION } from "@/lib/config/operator-session";
import { setClientSessionContext, setClientLeadsCache } from "@/lib/config/session";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import type { SessionContext } from "@/lib/config/session";
import type { FullLeadDetail } from "@/lib/types/crm";
import { createContext, useContext } from "react";

interface SessionState {
  session: SessionContext;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContextReact = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setClientSessionContext(SCS_NOVA_OPERATOR_SESSION);
    if (isLocalPreviewMode()) {
      setClientLeadsCache(getDataProvider().crm.getFullLeads());
    }
  }, []);

  const value: SessionState = {
    session: SCS_NOVA_OPERATOR_SESSION,
    loading: false,
    refresh: async () => {},
  };

  return (
    <SessionContextReact.Provider value={value}>
      {children}
    </SessionContextReact.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContextReact);
  if (!ctx) {
    return { session: SCS_NOVA_OPERATOR_SESSION, loading: false, refresh: async () => {} };
  }
  return ctx;
}
