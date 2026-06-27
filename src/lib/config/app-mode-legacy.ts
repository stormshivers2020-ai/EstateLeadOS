/** Env-only demo check — avoids circular imports with data provider. */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
}
