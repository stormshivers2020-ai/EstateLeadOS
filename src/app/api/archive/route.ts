import { NextResponse } from "next/server";
import { getLeadArchives, getProgramPackets } from "@/lib/services/program/local-store";
import {
  getArchiveHubData,
  getArchiveOverview,
  lockArchiveVersion,
  markArchiveRejected,
  markArchiveSuperseded,
  saveToInitialReviewArchive,
} from "@/lib/services/program/archive";
import type { ArchiveTabId } from "@/lib/types/program";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const packetId = searchParams.get("packetId");
  const tab = (searchParams.get("tab") ?? "all") as ArchiveTabId;

  if (packetId) {
    const packet = getProgramPackets().find((p) => p.id === packetId);
    if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ packet });
  }

  if (leadId) {
    return NextResponse.json({
      packets: getProgramPackets({ leadId }),
      archives: getLeadArchives({ leadId }),
    });
  }

  if (searchParams.has("tab")) {
    return NextResponse.json(getArchiveHubData(tab));
  }

  return NextResponse.json(getArchiveOverview());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "initial_archive") {
      const archive = saveToInitialReviewArchive(body.packetId, body.notes);
      return NextResponse.json({ archive, message: "Saved to Initial Review Archive." });
    }
    if (body.action === "lock") {
      const archive = lockArchiveVersion(body.archiveId);
      return NextResponse.json({ archive, message: "Archive version locked." });
    }
    if (body.action === "supersede") {
      const archive = markArchiveSuperseded(body.archiveId, body.supersededBy);
      return NextResponse.json({ archive, message: "Marked superseded." });
    }
    if (body.action === "reject") {
      const archive = markArchiveRejected(body.archiveId);
      return NextResponse.json({ archive, message: "Marked rejected." });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
