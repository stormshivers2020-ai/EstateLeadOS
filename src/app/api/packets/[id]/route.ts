import { NextResponse } from "next/server";
import { archivePacket, recordPacketPrint, saveToInitialReviewArchive } from "@/lib/services/program/archive";
import { buildAttorneyReviewFile } from "@/lib/services/distribution/attorney-review";
import { generatePdfPlaceholderUrl } from "@/lib/services/program/packet-builder";
import { getProgramPacket, updateProgramPacket } from "@/lib/services/program/local-store";

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

  if (body.action === "first_archive") {
    const archive = saveToInitialReviewArchive(id, body.notes ?? "First Archive — Step 14 · Initial Review Archive");
    updateProgramPacket(id, { archivedAt: archive.archivedAt, packetStatus: "archived" });
    return NextResponse.json({ archive, message: "Saved to First Archive (Step 14)." });
  }

  if (body.action === "print") {
    recordPacketPrint(id, packet.leadId, body.printType ?? "browser");
    return NextResponse.json({ success: true, printableHtml: packet.printableHtml });
  }

  if (body.action === "pdf_placeholder") {
    const pdfUrl = generatePdfPlaceholderUrl(id);
    updateProgramPacket(id, { pdfUrl });
    return NextResponse.json({ pdfUrl, message: "PDF export placeholder saved. Full PDF generation coming soon." });
  }

  if (body.action === "send_attorney_review") {
    try {
      await buildAttorneyReviewFile(body.leadId ?? packet.leadId, id);
      updateProgramPacket(id, { attorneyReviewStatus: "ready_for_attorney_review" });
      return NextResponse.json({
        success: true,
        message: "Packet sent to Attorney Review workflow. Draft documents require attorney/title review before use.",
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to send to attorney review" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
