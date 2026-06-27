import { NextResponse } from "next/server";
import { updatePersonVerification } from "@/lib/services/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  const { id, personId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | "needs_research" | undefined;

  if (!action || !["approve", "reject", "needs_research"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const person = await updatePersonVerification(id, personId, action, {
    notes: body.notes,
    contactMethod: body.contactMethod,
    sourceEvidenceId: body.sourceEvidenceId,
  });

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  return NextResponse.json({ person });
}
