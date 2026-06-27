import { NextResponse } from "next/server";
import { runEstateLeadOS } from "@/lib/services/program/index";
import type { LeadPacketType, ProgramAutomationMode, ProgramRunAction } from "@/lib/types/program";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action = body.action as ProgramRunAction;
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  try {
    const result = await runEstateLeadOS({
      action,
      mode: (body.mode as ProgramAutomationMode) ?? "supervised",
      leadId: body.leadId,
      countyName: body.countyName,
      stateAbbr: body.stateAbbr,
      packetType: body.packetType as LeadPacketType | undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Program run failed" },
      { status: 500 }
    );
  }
}
