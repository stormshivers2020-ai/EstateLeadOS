import "server-only";

import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentOrganizationId } from "./session";
import type { RejectedSourceRecord } from "@/lib/types/government";

export async function insertRejectedSource(record: RejectedSourceRecord): Promise<void> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return;

  const supabase = await createClient();
  await supabase.from("rejected_sources").insert({
    id: record.id,
    organization_id: orgId,
    search_id: record.searchId,
    source_name: record.sourceName,
    source_url: record.sourceUrl,
    source_type: record.sourceType,
    rejection_reason: record.rejectionReason,
    hostname: record.hostname,
    raw_title: record.rawTitle,
    raw_snippet: record.rawSnippet,
  });
}

export async function updateLeadGovernmentStatus(
  leadId: string,
  status: string
): Promise<void> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return;

  const supabase = await createClient();
  await supabase
    .from("leads")
    .update({ government_verification_status: status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("organization_id", orgId);
}

export async function fetchRejectedSourcesForSearch(searchId: string): Promise<RejectedSourceRecord[]> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("rejected_sources")
    .select("*")
    .eq("organization_id", orgId)
    .eq("search_id", searchId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    organizationId: row.organization_id as string,
    searchId: (row.search_id as string) ?? null,
    sourceName: (row.source_name as string) ?? null,
    sourceUrl: row.source_url as string,
    sourceType: (row.source_type as string) ?? null,
    rejectionReason: row.rejection_reason as string,
    hostname: (row.hostname as string) ?? null,
    rawTitle: (row.raw_title as string) ?? null,
    rawSnippet: (row.raw_snippet as string) ?? null,
    createdAt: row.created_at as string,
  }));
}
