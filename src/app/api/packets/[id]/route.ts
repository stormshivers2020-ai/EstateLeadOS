import { NextResponse } from "next/server";
import { archivePacket, recordPacketPrint } from "@/lib/services/program/archive";
import { getProgramPacket } from "@/lib/services/program/local-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const packet = getProgramPacket(id);
  if (!packet) return NextResponse.json({ error: "Packet not found" }, { status: 404 });

  if (body.action === "archive") {
    const archive = archivePacket(packet, body.notes);
    return NextResponse.json({ archive });
  }

  if (body.action === "print") {
    recordPacketPrint(id, packet.leadId, body.printType ?? "browser");
    return NextResponse.json({ success: true, printableHtml: packet.printableHtml });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
