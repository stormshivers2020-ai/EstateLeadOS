import { NextResponse } from "next/server";
import { activateAllMarylandPipelines } from "@/lib/services/pipeline/local-store";

export async function POST() {
  const counties = activateAllMarylandPipelines();
  return NextResponse.json({
    message: `Registered sources for ${counties.length} Maryland counties`,
    counties,
  });
}
