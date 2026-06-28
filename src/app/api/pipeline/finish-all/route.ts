import { NextResponse } from "next/server";
import { activateAllMarylandPipelines, runAllCountyPipelines } from "@/lib/services/pipeline/index";

/** Activate all MD county pipelines and run each eligible county sequentially */
export async function POST() {
  try {
    const counties = activateAllMarylandPipelines();
    const summary = await runAllCountyPipelines("MD");
    return NextResponse.json({
      message: `Finished ${summary.succeeded} of ${summary.attempted} county pipelines`,
      countiesRegistered: counties.length,
      ...summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Finish all pipelines failed" },
      { status: 500 }
    );
  }
}

/** Register sources for all Maryland counties without running */
export async function PATCH() {
  const counties = activateAllMarylandPipelines();
  return NextResponse.json({
    message: `Activated ${counties.length} Maryland county pipelines`,
    counties,
  });
}
