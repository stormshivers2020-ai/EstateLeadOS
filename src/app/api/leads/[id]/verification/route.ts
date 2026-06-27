import { NextResponse } from "next/server";
import { getLeadVerificationBundle } from "@/lib/services/verification";
import { getFullLeadById } from "@/lib/services/crm/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await getFullLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const bundle = await getLeadVerificationBundle(id, {
    propertyAddress: lead.propertyAddress,
    ownerName: lead.ownerName,
    parcelId: lead.parcelId,
  });

  return NextResponse.json({ bundle });
}
