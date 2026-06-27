import { isSupabaseMode } from "@/lib/config/runtime";
import type { DataProvider } from "./dataProvider";
import { getLocalDataProvider } from "./localDataProvider";
import { getSupabaseDataProvider } from "./supabaseDataProvider";

export function getDataProvider(): DataProvider {
  if (isSupabaseMode()) {
    return getSupabaseDataProvider();
  }
  return getLocalDataProvider();
}

export { getLocalDataProvider, getSupabaseDataProvider };
