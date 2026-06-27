import { NextResponse } from "next/server";
import { approvePipelineItem } from "@/lib/services/pipeline/index";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === "approve") {
    try {
      const item = approvePipelineItem(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ item });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Approval failed" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
