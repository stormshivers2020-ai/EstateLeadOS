import { NextResponse } from "next/server";
import { toggleCountyPause, updateCountyConfig } from "@/lib/services/pipeline/local-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ state: string; county: string }> }
) {
  const { state, county } = await params;
  const decodedCounty = decodeURIComponent(county);
  const body = await request.json().catch(() => ({}));

  if (body.action === "pause") {
    const config = toggleCountyPause(state.toUpperCase(), decodedCounty, true);
    return NextResponse.json({ config });
  }
  if (body.action === "resume") {
    const config = toggleCountyPause(state.toUpperCase(), decodedCounty, false);
    return NextResponse.json({ config });
  }
  if (body.status) {
    const config = updateCountyConfig(state.toUpperCase(), decodedCounty, {
      status: body.status,
      ...(body.isProofEngine !== undefined ? { isProofEngine: body.isProofEngine } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
    });
    return NextResponse.json({ config });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
