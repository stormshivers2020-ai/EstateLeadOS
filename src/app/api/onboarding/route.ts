import { NextResponse } from "next/server";
import { completeOnboarding } from "@/lib/supabase/queries/organization";
import { isSupabaseMode } from "@/lib/config/runtime";
import type { UserRoleId } from "@/lib/constants/roles";

export async function POST(request: Request) {
  if (!isSupabaseMode()) {
    return NextResponse.json({ ok: true, mode: "local" });
  }

  const body = await request.json();
  const organizationName = String(body.organizationName ?? "").trim();
  if (!organizationName) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  const result = await completeOnboarding({
    organizationName,
    role: (body.role ?? "org_admin") as UserRoleId,
    activeStates: Array.isArray(body.activeStates) ? body.activeStates.map(String) : [],
    activeCounties: Array.isArray(body.activeCounties) ? body.activeCounties.map(String) : [],
    disclaimerAcknowledged: Boolean(body.disclaimerAcknowledged),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Onboarding failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
