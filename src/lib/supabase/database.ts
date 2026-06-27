import "server-only";

/**
 * Direct Postgres connection (migrations, admin scripts, Supabase CLI).
 * Never expose DATABASE_URL to the client.
 */
export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || url.includes("[YOUR-PASSWORD]") || url.includes("YOUR_PASSWORD")) {
    return null;
  }
  return url;
}

export function assertDatabaseUrl(): string {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Postgres password from the Supabase dashboard (Connect → Database)."
    );
  }
  return url;
}

export const SUPABASE_DB_HOST = "db.zmsbiiyiztncynbpvctq.supabase.co";
export const SUPABASE_DB_PORT = 5432;
export const SUPABASE_DB_NAME = "postgres";
export const SUPABASE_DB_USER = "postgres";

/** Build URL when password is in a separate env var (avoids storing full URL in shell history). */
export function buildDatabaseUrl(password: string): string {
  const encoded = encodeURIComponent(password);
  return `postgresql://${SUPABASE_DB_USER}:${encoded}@${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}`;
}
