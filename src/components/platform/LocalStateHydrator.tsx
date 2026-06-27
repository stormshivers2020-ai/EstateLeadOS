"use client";

import { useEffect } from "react";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { initializeLocalState } from "@/lib/local/localStateStore";

export function LocalStateHydrator() {
  useEffect(() => {
    if (isLocalPreviewMode()) {
      initializeLocalState();
    }
  }, []);

  return null;
}
