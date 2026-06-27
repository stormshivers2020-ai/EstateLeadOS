import { NextResponse } from "next/server";
import { fetchLeadsForOrg, insertLead } from "@/lib/supabase/queries/leads";
import { getServerSessionContext } from "@/lib/supabase/queries/session";
import { isSupabaseMode } from "@/lib/config/runtime";

export async function GET() {
  if (!isSupabaseMode()) {
    return NextResponse.json({ leads: [] });
  }

  const session = await getServerSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await fetchLeadsForOrg();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  if (!isSupabaseMode()) {
    return NextResponse.json({ error: "Supabase mode required" }, { status: 400 });
  }

  const session = await getServerSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const propertyAddress = String(body.propertyAddress ?? "").trim();
  if (!propertyAddress) {
    return NextResponse.json({ error: "Property address is required" }, { status: 400 });
  }

  const lead = await insertLead({
    propertyAddress,
    ownerName: body.ownerName ? String(body.ownerName) : undefined,
    state: body.state ? String(body.state) : undefined,
    county: body.county ? String(body.county) : undefined,
    leadType: body.leadType ? String(body.leadType) : undefined,
    sourceName: body.sourceName ? String(body.sourceName) : undefined,
    estateLeadScore: body.estateLeadScore != null ? Number(body.estateLeadScore) : undefined,
    dealPotentialScore: body.dealPotentialScore != null ? Number(body.dealPotentialScore) : undefined,
    complianceRiskScore: body.complianceRiskScore != null ? Number(body.complianceRiskScore) : undefined,
    dataConfidenceScore: body.dataConfidenceScore != null ? Number(body.dataConfidenceScore) : undefined,
    nextAction: body.nextAction ? String(body.nextAction) : undefined,
  });

  if (!lead) {
    return NextResponse.json(
      { error: "Could not create lead. Confirm your organization profile is set up." },
      { status: 500 }
    );
  }

  return NextResponse.json({ lead }, { status: 201 });
}
