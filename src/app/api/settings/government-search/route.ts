import { NextResponse } from "next/server";
import {
  isGovernmentSourcesOnlyEnabled,
  setGovernmentSourcesOnly,
} from "@/lib/services/government/rejected-sources";
import { getSourceRegistry } from "@/lib/services/government/source-registry";

export async function GET() {
  return NextResponse.json({
    governmentSourcesOnly: isGovernmentSourcesOnlyEnabled(),
    sources: getSourceRegistry().filter((s) => s.isGovernmentSource && s.allowedForLeadCreation),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.governmentSourcesOnly === "boolean") {
    setGovernmentSourcesOnly(body.governmentSourcesOnly);
  }
  return NextResponse.json({ governmentSourcesOnly: isGovernmentSourcesOnlyEnabled() });
}
