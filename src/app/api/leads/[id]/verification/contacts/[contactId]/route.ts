import { NextResponse } from "next/server";
import { updateContactCandidate } from "@/lib/services/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | "needs_research" | undefined;

  if (!action || !["approve", "reject", "needs_research"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const contact = await updateContactCandidate(id, contactId, action, {
    notes: body.notes,
    sourceEvidenceId: body.sourceEvidenceId,
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact candidate not found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}
