import { NextResponse } from "next/server";
import { runCountyPipeline } from "@/lib/services/pipeline/index";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ state: string; county: string }> }
) {
  const { state, county } = await params;
  const decodedCounty = decodeURIComponent(county);

  try {
    const result = await runCountyPipeline(state.toUpperCase(), decodedCounty);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline run failed" },
      { status: 400 }
    );
  }
}
