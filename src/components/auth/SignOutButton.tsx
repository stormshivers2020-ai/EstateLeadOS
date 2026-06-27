"use client";

import { useRouter } from "next/navigation";
import { isSupabaseMode } from "@/lib/config/runtime";
import { signOut } from "@/lib/supabase/supabaseAuth";
import { SESSION_COOKIE } from "@/lib/auth/route-guard";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    if (isSupabaseMode()) {
      await signOut();
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } else {
      document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-[var(--nova-border)] px-4 py-2 text-sm text-[var(--nova-text-secondary)] hover:border-[var(--nova-red)] hover:text-[var(--nova-red)]"
    >
      Sign Out
    </button>
  );
}
