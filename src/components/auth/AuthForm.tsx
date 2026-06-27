"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SESSION_COOKIE } from "@/lib/auth/route-guard";
import { isLocalPreviewMode } from "@/lib/config/runtime";
import { signInWithPassword, signUpWithPassword } from "@/lib/supabase/supabaseAuth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function setLocalSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const localPreview = isLocalPreviewMode();
  const supabaseAuth = !localPreview && isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const org = String(form.get("org") ?? "");

    try {
      if (supabaseAuth) {
        if (mode === "signup") {
          const { error: signUpError } = await signUpWithPassword(email, password, {
            organization_name: org,
            full_name: email.split("@")[0],
          });
          if (signUpError) {
            setError(signUpError.message);
            return;
          }
          router.push("/onboarding");
        } else {
          const { error: signInError } = await signInWithPassword(email, password);
          if (signInError) {
            setError(signInError.message);
            return;
          }
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        setLocalSessionCookie();
        router.push(mode === "signup" ? "/onboarding" : "/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-lg border border-[rgba(255,94,94,0.3)] bg-[rgba(255,94,94,0.08)] px-3 py-2 text-xs text-[var(--nova-red)]">
          {error}
        </p>
      )}
      {supabaseAuth && (
        <p className="text-xs text-[var(--nova-text-muted)]">
          Signed in with Supabase Auth. Organization and profile are created on signup.
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--nova-text-secondary)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-[var(--nova-border)] bg-[var(--nova-panel-soft)] px-3 py-2 text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] focus:border-[var(--nova-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-gold)]"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--nova-text-secondary)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-[var(--nova-border)] bg-[var(--nova-panel-soft)] px-3 py-2 text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] focus:border-[var(--nova-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-gold)]"
          placeholder="••••••••"
        />
      </div>
      {mode === "signup" && (
        <div>
          <label htmlFor="org" className="block text-sm font-medium text-[var(--nova-text-secondary)]">
            Organization Name
          </label>
          <input
            id="org"
            name="org"
            type="text"
            required={supabaseAuth}
            className="mt-1 w-full rounded-lg border border-[var(--nova-border)] bg-[var(--nova-panel-soft)] px-3 py-2 text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] focus:border-[var(--nova-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--nova-gold)]"
            placeholder="Your acquisition company"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="nova-btn-primary w-full py-2.5 disabled:opacity-60"
      >
        {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
      </button>
      <p className="text-center text-sm text-[var(--nova-text-muted)]">
        {mode === "login" ? (
          <>No account? <Link href="/signup" className="text-[var(--nova-gold)] hover:underline">Start free trial</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="text-[var(--nova-gold)] hover:underline">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
