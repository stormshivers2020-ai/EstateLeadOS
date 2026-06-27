import { NextResponse } from "next/server";
import { getReviewQueueOverview } from "@/lib/services/program/review-queue";

export async function GET() {
  return NextResponse.json(getReviewQueueOverview());
}
