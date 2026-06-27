import { NextResponse } from "next/server";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { updateLead } from "@/lib/supabase/queries/leads";
import { isSupabaseMode } from "@/lib/config/runtime";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseMode()) {
    return NextResponse.json({ error: "Supabase mode required" }, { status: 400 });
  }

  const session = await getServerSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const ok = await updateLead(id, {
    pipelineStatus: body.pipelineStatus ? String(body.pipelineStatus) : undefined,
    nextAction: body.nextAction ? String(body.nextAction) : undefined,
    ownerName: body.ownerName ? String(body.ownerName) : undefined,
    estateLeadScore: body.estateLeadScore != null ? Number(body.estateLeadScore) : undefined,
    dealPotentialScore: body.dealPotentialScore != null ? Number(body.dealPotentialScore) : undefined,
  });

  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
