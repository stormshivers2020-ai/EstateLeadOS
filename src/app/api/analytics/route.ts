import { NextResponse } from "next/server";
import { getCommandCenterAnalytics, getLeadFinancials } from "@/lib/services/analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");

  if (leadId) {
    return NextResponse.json(getLeadFinancials(leadId));
  }

  return NextResponse.json(getCommandCenterAnalytics());
}
