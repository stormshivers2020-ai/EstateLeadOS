import { NextResponse } from "next/server";
import { approveInternetLead } from "@/lib/services/lead-discovery";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await approveInternetLead(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ leadId: result.leadId });
}
