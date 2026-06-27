import "server-only";

import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRoleId } from "@/lib/constants/roles";
import { getServerSessionContext } from "./session";

export async function completeOnboarding(input: {
  organizationName: string;
  role: UserRoleId;
  activeStates: string[];
  activeCounties: string[];
  disclaimerAcknowledged: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  assertSupabaseConfigured();
  const session = await getServerSessionContext();
  if (!session || session.organizationId === "pending" || session.organizationId === "unknown") {
    return { ok: false, error: "Session or organization not ready" };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: orgError } = await supabase
    .from("organizations")
    .update({
      name: input.organizationName.trim(),
      active_states: input.activeStates,
      active_counties: input.activeCounties,
    })
    .eq("id", session.organizationId);

  if (orgError) {
    console.error("[Supabase] completeOnboarding org:", orgError.message);
    return { ok: false, error: orgError.message };
  }

  const validRoles: UserRoleId[] = [
    "solo_investor",
    "acquisition_manager",
    "team_member",
    "compliance_reviewer",
    "org_admin",
    "scs_nova_super_admin",
  ];
  const role = validRoles.includes(input.role) ? input.role : "org_admin";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role,
      onboarding_completed_at: now,
      disclaimer_acknowledged_at: input.disclaimerAcknowledged ? now : null,
      updated_at: now,
    })
    .eq("id", session.userId);

  if (profileError) {
    console.error("[Supabase] completeOnboarding profile:", profileError.message);
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}
