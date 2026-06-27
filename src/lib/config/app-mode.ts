import { getRuntimeConfig, isLocalPreviewMode } from "./runtime";
import { hasLocalData, isLocalDemoActive } from "@/lib/local/localStateStore";
import { isDemoMode as envDemoFlag } from "./app-mode-legacy";

export type AppMode = "demo" | "fresh_start";

export function getAppMode(): AppMode {
  if (isLocalPreviewMode()) {
    return isLocalDemoActive() ? "demo" : "fresh_start";
  }
  return envDemoFlag() ? "demo" : "fresh_start";
}

export function isDemoMode(): boolean {
  return getAppMode() === "demo";
}

export function shouldLoadSeedData(): boolean {
  if (isLocalPreviewMode()) {
    return hasLocalData();
  }
  return envDemoFlag();
}
