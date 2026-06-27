import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/config/runtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "local";
  const supabase = isSupabaseMode() && isSupabaseConfigured();

  return NextResponse.json({
    status: "ok",
    service: "estate-lead-os",
    version: process.env.npm_package_version ?? "0.1.0",
    provider,
    supabaseConfigured: supabase,
    timestamp: new Date().toISOString(),
  });
}
