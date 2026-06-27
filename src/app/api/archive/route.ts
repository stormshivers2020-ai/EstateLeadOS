import { NextResponse } from "next/server";
import { getLeadArchives, getProgramPackets } from "@/lib/services/program/local-store";
import { getArchiveOverview } from "@/lib/services/program/archive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const packetId = searchParams.get("packetId");

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

  return NextResponse.json(getArchiveOverview());
}
