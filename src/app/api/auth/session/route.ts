import { NextResponse } from "next/server";
import { SCS_NOVA_OPERATOR_SESSION } from "@/lib/config/operator-session";

export async function GET() {
  return NextResponse.json({ session: SCS_NOVA_OPERATOR_SESSION });
}
