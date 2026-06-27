import { NextResponse } from "next/server";
import { updateLeadGovernmentVerification } from "@/lib/services/verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | "needs_research" | undefined;

  if (!action || !["approve", "reject", "needs_research"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const bundle = await updateLeadGovernmentVerification(id, action, { notes: body.notes });
  if (!bundle) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ bundle });
}
