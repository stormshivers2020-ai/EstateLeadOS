import { NextResponse } from "next/server";
import {
  buildAttorneyReviewFile,
  getAttorneyReview,
  updateAttorneyReview,
  markSentToAttorney,
  acknowledgeManualOverride,
  getAttorneyCompensation,
  getOrCreateCompensation,
  updateCompensation,
  getDistributionAuditLogs,
  uploadAttorneyFile,
} from "@/lib/services/distribution/index";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const review = getAttorneyReview(leadId);
  const compensation = getAttorneyCompensation(leadId);
  const audit = getDistributionAuditLogs(leadId);
  return NextResponse.json({ review, compensation, audit });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "build_review_file") {
      const review = await buildAttorneyReviewFile(leadId, body.packetId);
      return NextResponse.json({ review });
    }
    if (body.action === "mark_sent") {
      return NextResponse.json({ review: markSentToAttorney(leadId) });
    }
    if (body.action === "update") {
      return NextResponse.json({ review: updateAttorneyReview(leadId, body.patch) });
    }
    if (body.action === "manual_override") {
      return NextResponse.json({ review: acknowledgeManualOverride(leadId) });
    }
    if (body.action === "upload") {
      const upload = await uploadAttorneyFile({
        leadId,
        fileName: body.fileName,
        fileType: body.fileType ?? "application/pdf",
        fileUrl: body.fileUrl,
        documentCategory: body.documentCategory,
        notes: body.notes,
        packetId: body.packetId,
      });
      return NextResponse.json({ upload, review: getAttorneyReview(leadId) });
    }
    if (body.action === "update_compensation") {
      const review = getAttorneyReview(leadId);
      if (!review) return NextResponse.json({ error: "Start attorney review first" }, { status: 400 });
      getOrCreateCompensation(leadId, review.id);
      return NextResponse.json({ compensation: updateCompensation(leadId, body.patch) });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
