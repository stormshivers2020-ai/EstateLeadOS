import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import { mapSupabaseLeadRow, type SupabaseLeadRow } from "@/lib/supabase/mappers/lead";
import type { FullLeadDetail } from "@/lib/types/crm";
import { getCurrentOrganizationId } from "./session";

import {
  PENDING_INTERNET_NEXT_ACTION,
  PENDING_INTERNET_PIPELINE,
  PENDING_INTERNET_SOURCE_PREFIX,
} from "@/lib/services/lead-discovery/types";

export const fetchLeadsForOrg = cache(async (): Promise<FullLeadDetail[]> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId || orgId === "pending" || orgId === "unknown") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .neq("pipeline_status", PENDING_INTERNET_PIPELINE)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchLeadsForOrg:", error.message);
    return [];
  }

  return (data as SupabaseLeadRow[]).map(mapSupabaseLeadRow);
});

export const fetchLeadById = cache(async (id: string): Promise<FullLeadDetail | null> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[Supabase] fetchLeadById:", error.message);
    return null;
  }

  return mapSupabaseLeadRow(data as SupabaseLeadRow);
});

export async function insertLead(input: {
  propertyAddress: string;
  ownerName?: string;
  state?: string;
  county?: string;
  city?: string;
  zipCode?: string;
  leadType?: string;
  sourceName?: string;
  estateLeadScore?: number;
  dealPotentialScore?: number;
  complianceRiskScore?: number;
  dataConfidenceScore?: number;
  nextAction?: string;
  pipelineStatus?: string;
}): Promise<FullLeadDetail | null> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: orgId,
      property_address: input.propertyAddress,
      owner_name: input.ownerName ?? null,
      state: input.state ?? null,
      county: input.county ?? null,
      city: input.city ?? null,
      zip_code: input.zipCode ?? null,
      lead_type: input.leadType ?? "probate_inherited",
      pipeline_status: input.pipelineStatus ?? "new_lead",
      source_name: input.sourceName ?? "Manual entry",
      estate_lead_score: input.estateLeadScore ?? 0,
      deal_potential_score: input.dealPotentialScore ?? 0,
      compliance_risk_score: input.complianceRiskScore ?? 0,
      data_confidence_score: input.dataConfidenceScore ?? 55,
      next_action: input.nextAction ?? "Run Nova Guided Workflow — research and compliance review",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[Supabase] insertLead:", error?.message);
    return null;
  }

  return mapSupabaseLeadRow(data as SupabaseLeadRow);
}

export async function updateLead(
  leadId: string,
  updates: {
    pipelineStatus?: string;
    nextAction?: string;
    ownerName?: string;
    estateLeadScore?: number;
    dealPotentialScore?: number;
  }
): Promise<boolean> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return false;

  const supabase = await createClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.pipelineStatus) patch.pipeline_status = updates.pipelineStatus;
  if (updates.nextAction) patch.next_action = updates.nextAction;
  if (updates.ownerName) patch.owner_name = updates.ownerName;
  if (updates.estateLeadScore != null) patch.estate_lead_score = updates.estateLeadScore;
  if (updates.dealPotentialScore != null) patch.deal_potential_score = updates.dealPotentialScore;

  const { error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .eq("organization_id", orgId);

  return !error;
}

export async function insertPendingInternetLead(input: {
  propertyAddress: string;
  ownerName?: string;
  state?: string;
  county?: string;
  city?: string;
  leadType?: string;
  sourceName?: string;
  sourceUrl: string;
  estateLeadScore?: number;
  dealPotentialScore?: number;
  complianceRiskScore?: number;
  dataConfidenceScore?: number;
}): Promise<FullLeadDetail | null> {
  return insertLead({
    ...input,
    sourceName: input.sourceName ?? PENDING_INTERNET_SOURCE_PREFIX,
    nextAction: `${PENDING_INTERNET_NEXT_ACTION} — ${input.sourceUrl}`,
    pipelineStatus: PENDING_INTERNET_PIPELINE,
  });
}

export const fetchPendingInternetLeads = cache(async (): Promise<FullLeadDetail[]> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId || orgId === "pending" || orgId === "unknown") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .eq("pipeline_status", PENDING_INTERNET_PIPELINE)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchPendingInternetLeads:", error.message);
    return [];
  }

  return (data as SupabaseLeadRow[]).map(mapSupabaseLeadRow);
});

export async function approvePendingLead(leadId: string): Promise<boolean> {
  return updateLead(leadId, {
    pipelineStatus: "new_lead",
    nextAction: "Run Probate Research Wizard — verify before outreach",
  });
}

export async function rejectPendingLead(leadId: string): Promise<boolean> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return false;

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", orgId)
    .eq("pipeline_status", PENDING_INTERNET_PIPELINE);

  return !error;
}
