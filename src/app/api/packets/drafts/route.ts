import { NextResponse } from "next/server";
import { getDraftSignatureDocuments } from "@/lib/services/program/local-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const packetId = searchParams.get("packetId") ?? undefined;

  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const documents = getDraftSignatureDocuments({ leadId, packetId });
  return NextResponse.json({ documents });
}
