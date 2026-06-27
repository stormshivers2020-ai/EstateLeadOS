import { NextResponse } from "next/server";
import {
  buildDistributionPacket,
  getDistributionPackets,
  updateRedactionChecklist,
  approveDistributionForSend,
  checkAttorneyApprovalGate,
} from "@/lib/services/distribution/index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  const gate = checkAttorneyApprovalGate(leadId);
  return NextResponse.json({ packets: getDistributionPackets({ leadId }), gate });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "build") {
      const packet = await buildDistributionPacket({
        leadId: body.leadId,
        packetType: body.packetType,
        sourcePacketId: body.sourcePacketId,
        includeAttorneyNotes: body.includeAttorneyNotes,
      });
      return NextResponse.json({ packet });
    }
    if (body.action === "redaction") {
      const packet = updateRedactionChecklist(body.packetId, body.itemId, body.complete);
      return NextResponse.json({ packet });
    }
    if (body.action === "approve_send") {
      const packet = approveDistributionForSend(body.packetId);
      return NextResponse.json({ packet });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
