import { NextResponse } from "next/server";
import { buildLeadPacketRecord, getLatestLeadPacket } from "@/lib/services/packet-builder";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const packet = getLatestLeadPacket(leadId);
  if (!packet) {
    return NextResponse.json({ packet: null, message: "No packet built yet for this lead." });
  }
  return NextResponse.json({ packet });
}
