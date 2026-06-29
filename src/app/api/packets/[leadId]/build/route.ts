import { NextResponse } from "next/server";
import { buildLeadPacketRecord, getLatestLeadPacket, markLeadPacketArchived } from "@/lib/services/packet-builder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.archive) {
    const latest = getLatestLeadPacket(leadId);
    if (!latest) {
      return NextResponse.json({ error: "Build a packet before archiving." }, { status: 400 });
    }
    const archived = markLeadPacketArchived(latest.id);
    return NextResponse.json({ packet: archived });
  }

  try {
    const packet = buildLeadPacketRecord({
      leadId,
      rebuild: Boolean(body.rebuild),
    });
    return NextResponse.json({ packet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build packet." },
      { status: 400 }
    );
  }
}
