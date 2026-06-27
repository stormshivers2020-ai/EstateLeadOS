export type DataProviderType = "local" | "supabase";
export type AppRuntimeMode = "local" | "supabase";

export interface RuntimeConfig {
  appMode: AppRuntimeMode;
  dataProvider: DataProviderType;
  enableDemoMode: boolean;
  enableFreshStart: boolean;
  useSupabase: boolean;
  useLocalAuth: boolean;
  useLocalStorage: boolean;
  isLocalPreview: boolean;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

export function getRuntimeConfig(): RuntimeConfig {
  const dataProvider = (process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "local") as DataProviderType;
  const appMode = (process.env.NEXT_PUBLIC_APP_MODE ?? "local") as AppRuntimeMode;
  const useSupabase = envBool("NEXT_PUBLIC_USE_SUPABASE", false);
  const enableDemoMode = envBool("NEXT_PUBLIC_ENABLE_DEMO_MODE", envBool("NEXT_PUBLIC_DEMO_MODE", true));
  const enableFreshStart = envBool("NEXT_PUBLIC_ENABLE_FRESH_START", true);

  const resolvedProvider: DataProviderType =
    dataProvider === "supabase" || useSupabase ? "supabase" : "local";

  return {
    appMode: resolvedProvider === "supabase" ? "supabase" : appMode,
    dataProvider: resolvedProvider,
    enableDemoMode,
    enableFreshStart,
    useSupabase: resolvedProvider === "supabase",
    useLocalAuth: envBool("NEXT_PUBLIC_USE_LOCAL_AUTH", resolvedProvider === "local"),
    useLocalStorage: envBool("NEXT_PUBLIC_USE_LOCAL_STORAGE", resolvedProvider === "local"),
    isLocalPreview: resolvedProvider === "local",
  };
}

export function isLocalPreviewMode(): boolean {
  return getRuntimeConfig().isLocalPreview;
}

export function isSupabaseMode(): boolean {
  return getRuntimeConfig().dataProvider === "supabase";
}
