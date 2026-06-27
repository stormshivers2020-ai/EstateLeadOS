import "server-only";

import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentOrganizationId } from "./session";
import type {
  AutomationRunRecord,
  CountyPipelineConfig,
  LeadPipelineEvent,
  LeadPipelineItem,
} from "@/lib/types/pipeline";

function mapCounty(row: Record<string, unknown>): CountyPipelineConfig {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    stateAbbr: String(row.state_abbr),
    countyName: String(row.county_name),
    status: row.status as CountyPipelineConfig["status"],
    automationMode: row.automation_mode as CountyPipelineConfig["automationMode"],
    isPaused: Boolean(row.is_paused),
    isProofEngine: Boolean(row.is_proof_engine),
    activeSourceIds: (row.active_source_ids as string[]) ?? [],
    signalsFound: Number(row.signals_found ?? 0),
    estateMatches: Number(row.estate_matches ?? 0),
    propertyMatches: Number(row.property_matches ?? 0),
    readyForReview: Number(row.ready_for_review ?? 0),
    verifiedLeads: Number(row.verified_leads ?? 0),
    rejectedLeads: Number(row.rejected_leads ?? 0),
    lastRunAt: (row.last_run_at as string) ?? null,
    lastRunId: (row.last_run_id as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listCountyPipelineConfigs(): Promise<CountyPipelineConfig[]> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("county_pipeline_configs")
    .select("*")
    .eq("organization_id", orgId)
    .order("county_name");

  if (error || !data) return [];
  return data.map((row) => mapCounty(row as Record<string, unknown>));
}

export async function upsertCountyPipelineConfig(
  config: Partial<CountyPipelineConfig> & Pick<CountyPipelineConfig, "stateAbbr" | "countyName">
): Promise<CountyPipelineConfig | null> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("county_pipeline_configs")
    .upsert(
      {
        organization_id: orgId,
        state_abbr: config.stateAbbr,
        county_name: config.countyName,
        status: config.status,
        automation_mode: config.automationMode,
        is_paused: config.isPaused,
        is_proof_engine: config.isProofEngine,
        active_source_ids: config.activeSourceIds,
        notes: config.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,state_abbr,county_name" }
    )
    .select("*")
    .single();

  if (error || !data) return null;
  return mapCounty(data as Record<string, unknown>);
}

export async function insertLeadPipelineEvent(
  event: Omit<LeadPipelineEvent, "id" | "createdAt">
): Promise<void> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return;

  const supabase = await createClient();
  await supabase.from("lead_pipeline_events").insert({
    organization_id: orgId,
    pipeline_item_id: event.pipelineItemId,
    lead_id: event.leadId,
    county_config_id: event.countyConfigId,
    automation_run_id: event.automationRunId,
    actor_user_id: event.actorUserId,
    actor_user_name: event.actorUserName,
    event_type: event.eventType,
    prior_stage: event.priorStage,
    new_stage: event.newStage,
    source_name: event.sourceName,
    source_url: event.sourceUrl,
    confidence_score: event.confidenceScore,
    reason: event.reason,
    evidence_id: event.evidenceId,
    metadata: event.metadata ?? {},
  });
}

export async function listLeadPipelineItems(filters?: {
  countyName?: string;
  stage?: LeadPipelineItem["pipelineStage"];
}): Promise<LeadPipelineItem[]> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  let query = supabase.from("lead_pipeline_items").select("*").eq("organization_id", orgId);
  if (filters?.countyName) query = query.eq("county_name", filters.countyName);
  if (filters?.stage) query = query.eq("pipeline_stage", filters.stage);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    leadId: row.lead_id as string | null,
    countyConfigId: row.county_config_id as string | null,
    stateAbbr: String(row.state_abbr),
    countyName: String(row.county_name),
    pipelineStage: row.pipeline_stage as LeadPipelineItem["pipelineStage"],
    propertyAddress: row.property_address as string | null,
    decedentName: row.decedent_name as string | null,
    personalRepresentative: row.personal_representative as string | null,
    confidenceScore: Number(row.confidence_score ?? 0),
    governmentSourcesOnly: Boolean(row.government_sources_only),
    manualApprovalRequired: Boolean(row.manual_approval_required),
    manuallyApproved: Boolean(row.manually_approved),
    approvedBy: row.approved_by as string | null,
    approvedAt: row.approved_at as string | null,
    notes: row.notes as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function listAutomationRuns(countyName?: string): Promise<AutomationRunRecord[]> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  let query = supabase.from("automation_runs").select("*").eq("organization_id", orgId);
  if (countyName) query = query.eq("county_name", countyName);

  const { data, error } = await query.order("started_at", { ascending: false }).limit(50);
  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    countyConfigId: row.county_config_id as string | null,
    stateAbbr: String(row.state_abbr),
    countyName: String(row.county_name),
    runType: String(row.run_type),
    status: row.status as AutomationRunRecord["status"],
    automationMode: row.automation_mode as AutomationRunRecord["automationMode"],
    sourcesQueried: Number(row.sources_queried ?? 0),
    signalsFound: Number(row.signals_found ?? 0),
    itemsCreated: Number(row.items_created ?? 0),
    itemsRejected: Number(row.items_rejected ?? 0),
    errors: Number(row.errors ?? 0),
    startedAt: String(row.started_at),
    completedAt: row.completed_at as string | null,
    summary: row.summary as string | null,
    createdAt: String(row.created_at),
  }));
}
