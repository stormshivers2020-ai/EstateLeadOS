import { NextResponse } from "next/server";
import {
  discoverLeadsFromInternet,
  isInternetSearchConfigured,
} from "@/lib/services/lead-discovery";

export async function GET() {
  return NextResponse.json({
    configured: isInternetSearchConfigured(),
    provider: "tavily",
    source: "internet_search",
  });
}

export async function POST(request: Request) {
  if (!isInternetSearchConfigured()) {
    return NextResponse.json(
      {
        error:
          "Internet lead search is not configured. Add TAVILY_API_KEY to .env.local (sign up at https://tavily.com).",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const result = await discoverLeadsFromInternet({
      state: String(body.state ?? "").trim(),
      county: String(body.county ?? "").trim(),
      city: body.city ? String(body.city).trim() : undefined,
      maxResults: body.maxResults != null ? Number(body.maxResults) : 12,
    });

    return NextResponse.json(result, { status: result.pendingQueued > 0 ? 201 : 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internet lead search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
