"use client";

import { useEffect } from "react";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { initializeLocalState } from "@/lib/local/localStateStore";

function envDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
}

export function LocalStateHydrator() {
  useEffect(() => {
    if (isLocalPreviewMode()) {
      initializeLocalState(envDemoEnabled() ? undefined : false);
    }
  }, []);

  return null;
}
