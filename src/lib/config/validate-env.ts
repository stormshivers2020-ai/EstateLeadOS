/** Build-time validation for production environment variables. */

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "local";
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
  const supabaseMode = provider === "supabase" || useSupabase;

  if (!supabaseMode) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  const errors: string[] = [];
  if (!url || url.includes("YOUR_PROJECT")) errors.push("NEXT_PUBLIC_SUPABASE_URL is missing or placeholder");
  if (!key || key.includes("your-anon") || key.includes("your-publishable")) {
    errors.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or placeholder");
  }

  if (errors.length > 0) {
    throw new Error(`Production Supabase configuration invalid:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}
