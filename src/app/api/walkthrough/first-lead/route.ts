import { NextResponse } from "next/server";
import {
  createWalkthroughSession,
  getActiveWalkthroughSession,
  getWalkthroughSessions,
} from "@/lib/services/walkthrough/session-store";

export async function GET() {
  const active = getActiveWalkthroughSession();
  const sessions = getWalkthroughSessions();
  return NextResponse.json({ active, sessions });
}

export async function POST() {
  const session = createWalkthroughSession();
  return NextResponse.json({ session });
}
