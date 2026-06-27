import { NextResponse } from "next/server";
import { getPipelineDashboard } from "@/lib/services/pipeline/local-store";

export async function GET() {
  const dashboard = getPipelineDashboard();
  return NextResponse.json(dashboard);
}
