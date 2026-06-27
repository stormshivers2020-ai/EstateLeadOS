import { NextResponse } from "next/server";
import { insertCommunicationLog } from "@/lib/supabase/queries/crm";
import { insertLeadNote } from "@/lib/supabase/queries/crm";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export async function POST(
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

  const { id: leadId } = await params;
  const body = await request.json();
  const type = String(body.type ?? "communication");

  if (type === "note") {
    const note = await insertLeadNote({
      leadId,
      body: String(body.body ?? ""),
      noteType: body.noteType ? String(body.noteType) : "research",
    });
    if (!note) return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
    return NextResponse.json({ note }, { status: 201 });
  }

  const log = await insertCommunicationLog({
    leadId,
    contactMethod: body.contactMethod === "phone" ? "call" : String(body.contactMethod ?? "call"),
    messageBody: String(body.messageBody ?? "Outreach logged"),
    outcome: body.outcome ? String(body.outcome) : "follow_up_requested",
    followUpDate: body.followUpDate ? String(body.followUpDate) : undefined,
    contactPerson: body.contactPerson ? String(body.contactPerson) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  });

  if (!log) {
    return NextResponse.json({ error: "Failed to log communication" }, { status: 500 });
  }

  return NextResponse.json({ communication: log }, { status: 201 });
}
