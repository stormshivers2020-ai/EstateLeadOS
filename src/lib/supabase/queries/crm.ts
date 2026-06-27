import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import {
  mapCommunicationLog,
  mapFollowUp,
  mapLeadNote,
  type CommunicationLogRow,
  type FollowUpRow,
  type LeadNoteRow,
} from "@/lib/supabase/mappers/crm";
import type { CommunicationLog, FollowUpReminder, LeadNote } from "@/lib/types/crm";
import { getCurrentOrganizationId, getServerSessionContext } from "./session";

export const fetchCommunicationLogs = cache(async (leadId?: string): Promise<CommunicationLog[]> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("communication_logs")
    .select("*, profiles:user_id ( full_name, email )")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] fetchCommunicationLogs:", error.message);
    return [];
  }

  return (data as CommunicationLogRow[]).map(mapCommunicationLog);
});

export const fetchLeadNotes = cache(async (leadId?: string): Promise<LeadNote[]> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("lead_notes")
    .select("*, profiles:user_id ( full_name, email )")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] fetchLeadNotes:", error.message);
    return [];
  }

  return (data as LeadNoteRow[]).map(mapLeadNote);
});

export const fetchFollowUps = cache(async (leadId?: string): Promise<FollowUpReminder[]> => {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return [];

  const supabase = await createClient();
  let query = supabase
    .from("follow_up_reminders")
    .select("*, leads:lead_id ( property_address ), profiles:assigned_user_id ( full_name, email )")
    .eq("organization_id", orgId)
    .order("follow_up_date", { ascending: true });

  if (leadId) query = query.eq("lead_id", leadId);

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] fetchFollowUps:", error.message);
    return [];
  }

  return (data as FollowUpRow[]).map(mapFollowUp);
});

export async function insertCommunicationLog(input: {
  leadId: string;
  contactMethod: string;
  messageBody: string;
  outcome?: string;
  followUpDate?: string;
  contactPerson?: string;
  notes?: string;
}): Promise<CommunicationLog | null> {
  assertSupabaseConfigured();
  const session = await getServerSessionContext();
  const orgId = await getCurrentOrganizationId();
  if (!session || !orgId) return null;

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("communication_logs")
    .insert({
      lead_id: input.leadId,
      organization_id: orgId,
      user_id: session.userId,
      communication_date: today,
      contact_method: input.contactMethod,
      contact_person: input.contactPerson ?? "Property Owner",
      contact_role: "owner",
      message_body_snapshot: input.messageBody,
      outcome: input.outcome ?? "follow_up_requested",
      follow_up_date: input.followUpDate ?? null,
      consent_status: input.contactMethod === "sms" ? "consent_needed" : "not_applicable",
      dnc_status: false,
      state_outreach_warning_reviewed: true,
      dnc_reminder_acknowledged: true,
      notes: input.notes ?? null,
    })
    .select("*, profiles:user_id ( full_name, email )")
    .single();

  if (error || !data) {
    console.error("[Supabase] insertCommunicationLog:", error?.message);
    return null;
  }

  if (input.followUpDate) {
    await supabase.from("follow_up_reminders").insert({
      lead_id: input.leadId,
      organization_id: orgId,
      assigned_user_id: session.userId,
      follow_up_date: input.followUpDate,
      follow_up_method: input.contactMethod === "phone" ? "call" : input.contactMethod,
      reason: "Scheduled from outreach wizard",
      status: "scheduled",
    });
    await supabase
      .from("leads")
      .update({
        pipeline_status: "first_outreach_sent",
        next_action: `Follow up by ${input.followUpDate}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.leadId)
      .eq("organization_id", orgId);
  }

  return mapCommunicationLog(data as CommunicationLogRow);
}

export async function insertLeadNote(input: {
  leadId: string;
  body: string;
  noteType?: string;
}): Promise<LeadNote | null> {
  assertSupabaseConfigured();
  const session = await getServerSessionContext();
  const orgId = await getCurrentOrganizationId();
  if (!session || !orgId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({
      lead_id: input.leadId,
      organization_id: orgId,
      user_id: session.userId,
      note_type: input.noteType ?? "research",
      body: input.body,
      visibility: "internal_team",
    })
    .select("*, profiles:user_id ( full_name, email )")
    .single();

  if (error || !data) {
    console.error("[Supabase] insertLeadNote:", error?.message);
    return null;
  }

  return mapLeadNote(data as LeadNoteRow);
}
