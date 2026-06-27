import { createClient } from "@/lib/supabase/client";
import { isSupabaseMode } from "@/lib/config/runtime";
import { assertSupabaseConfigured } from "@/lib/supabase/env";

const NOT_CONFIGURED =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

export async function signInWithPassword(email: string, password: string) {
  if (!isSupabaseMode()) {
    return { error: null, data: { user: null } };
  }
  assertSupabaseConfigured();
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: { full_name?: string; organization_name?: string }
) {
  if (!isSupabaseMode()) {
    return { error: null, data: { user: null } };
  }
  assertSupabaseConfigured();
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata ?? {},
    },
  });
}

export async function signOut() {
  if (!isSupabaseMode()) return { error: null };
  assertSupabaseConfigured();
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getSupabaseUser() {
  if (!isSupabaseMode()) return null;
  assertSupabaseConfigured();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
