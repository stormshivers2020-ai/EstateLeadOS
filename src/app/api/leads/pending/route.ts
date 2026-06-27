import { NextResponse } from "next/server";
import { getPendingInternetLeads } from "@/lib/services/lead-discovery";

export async function GET() {
  const pending = await getPendingInternetLeads();
  return NextResponse.json({ pending, count: pending.length });
}
