import "server-only";

import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentOrganizationId } from "./session";
import type { LeadSearchCandidate } from "@/lib/services/lead-discovery/types";
import { buildVerificationFromCandidate } from "@/lib/services/verification/evidence-builder";
import { assembleVerificationBundle } from "@/lib/services/verification/proof-chain";
import { annotateCitations } from "@/lib/services/verification/citation";
import type {
  ContactCandidate,
  EvidenceSource,
  LeadVerificationBundle,
  PersonVerification,
  PropertyMedia,
  RecordHit,
  VerificationActionLog,
} from "@/lib/types/verification";

function mapRecordHit(row: Record<string, unknown>): RecordHit {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    searchId: (row.search_id as string) ?? null,
    sourceName: (row.source_name as string) ?? null,
    sourceType: row.source_type as string,
    sourceUrl: (row.source_url as string) ?? null,
    sourceTitle: (row.source_title as string) ?? null,
    rawSnippet: (row.raw_snippet as string) ?? null,
    matchedFields: (row.matched_fields as Record<string, string>) ?? {},
    confidenceScore: (row.confidence_score as number) ?? 0,
    createdAt: row.created_at as string,
  };
}

function mapEvidence(row: Record<string, unknown>): EvidenceSource {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    recordHitId: (row.record_hit_id as string) ?? null,
    sourceName: row.source_name as string,
    sourceType: row.source_type as string,
    sourceUrl: (row.source_url as string) ?? null,
    sourceTitle: (row.source_title as string) ?? null,
    citationLabel: (row.citation_label as string) ?? null,
    retrievedAt: row.retrieved_at as string,
    screenshotUrl: (row.screenshot_url as string) ?? null,
    sourceExcerpt: (row.source_excerpt as string) ?? null,
    sourceHash: (row.source_hash as string) ?? null,
    confidenceScore: (row.confidence_score as number) ?? 0,
    matchedFields: (row.matched_fields as Record<string, string>) ?? {},
    jurisdictionState: (row.jurisdiction_state as string) ?? null,
    jurisdictionCounty: (row.jurisdiction_county as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapPerson(row: Record<string, unknown>): PersonVerification {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    personName: row.person_name as string,
    roleLabel: row.role_label as PersonVerification["roleLabel"],
    connectionRationale: (row.connection_rationale as string) ?? null,
    confidenceScore: (row.confidence_score as number) ?? 0,
    verificationStatus: row.verification_status as PersonVerification["verificationStatus"],
    approvedBy: (row.approved_by as string) ?? null,
    approvedAt: (row.approved_at as string) ?? null,
    rejectedAt: (row.rejected_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapContact(row: Record<string, unknown>): ContactCandidate {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    personVerificationId: (row.person_verification_id as string) ?? null,
    personName: (row.person_name as string) ?? null,
    contactType: row.contact_type as ContactCandidate["contactType"],
    contactValue: row.contact_value as string,
    sourceName: (row.source_name as string) ?? null,
    sourceUrl: (row.source_url as string) ?? null,
    confidenceScore: (row.confidence_score as number) ?? 0,
    verificationStatus: row.verification_status as ContactCandidate["verificationStatus"],
    lastVerifiedAt: (row.last_verified_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapMedia(row: Record<string, unknown>): PropertyMedia {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    propertyId: (row.property_id as string) ?? null,
    mediaType: row.media_type as PropertyMedia["mediaType"],
    mediaUrl: row.media_url as string,
    sourceName: (row.source_name as string) ?? null,
    sourceUrl: (row.source_url as string) ?? null,
    attribution: (row.attribution as string) ?? null,
    retrievedAt: row.retrieved_at as string,
    createdAt: row.created_at as string,
  };
}

function mapActionLog(row: Record<string, unknown>): VerificationActionLog {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    leadId: row.lead_id as string,
    actorUserId: (row.actor_user_id as string) ?? null,
    actorUserName: (row.actor_user_name as string) ?? null,
    actionType: row.action_type as string,
    targetType: row.target_type as VerificationActionLog["targetType"],
    targetId: (row.target_id as string) ?? null,
    sourceEvidenceId: (row.source_evidence_id as string) ?? null,
    contactMethod: (row.contact_method as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function saveVerificationFromCandidate(
  leadId: string,
  candidate: LeadSearchCandidate,
  searchId: string
): Promise<void> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return;

  const built = buildVerificationFromCandidate(leadId, orgId, candidate, searchId);
  const supabase = await createClient();

  await supabase.from("record_hits").delete().eq("lead_id", leadId);
  await supabase.from("evidence_sources").delete().eq("lead_id", leadId);
  await supabase.from("person_verifications").delete().eq("lead_id", leadId);
  await supabase.from("contact_candidates").delete().eq("lead_id", leadId);
  await supabase.from("property_media").delete().eq("lead_id", leadId);

  const { recordHit, evidenceSources, persons, contactCandidates, propertyMedia } = built;

  await supabase.from("record_hits").insert({
    id: recordHit.id,
    organization_id: orgId,
    lead_id: leadId,
    search_id: recordHit.searchId,
    source_name: recordHit.sourceName,
    source_type: recordHit.sourceType,
    source_url: recordHit.sourceUrl,
    source_title: recordHit.sourceTitle,
    raw_snippet: recordHit.rawSnippet,
    matched_fields: recordHit.matchedFields,
    confidence_score: recordHit.confidenceScore,
  });

  if (evidenceSources.length > 0) {
    await supabase.from("evidence_sources").insert(
      evidenceSources.map((e) => ({
        id: e.id,
        organization_id: orgId,
        lead_id: leadId,
        record_hit_id: e.recordHitId,
        source_name: e.sourceName,
        source_type: e.sourceType,
        source_url: e.sourceUrl,
        source_title: e.sourceTitle,
        citation_label: e.citationLabel,
        retrieved_at: e.retrievedAt,
        screenshot_url: e.screenshotUrl,
        source_excerpt: e.sourceExcerpt,
        source_hash: e.sourceHash,
        confidence_score: e.confidenceScore,
      }))
    );
  }

  if (persons.length > 0) {
    await supabase.from("person_verifications").insert(
      persons.map((p) => ({
        id: p.id,
        organization_id: orgId,
        lead_id: leadId,
        person_name: p.personName,
        role_label: p.roleLabel,
        connection_rationale: p.connectionRationale,
        confidence_score: p.confidenceScore,
        verification_status: p.verificationStatus,
      }))
    );
  }

  if (contactCandidates.length > 0) {
    await supabase.from("contact_candidates").insert(
      contactCandidates.map((c) => ({
        id: c.id,
        organization_id: orgId,
        lead_id: leadId,
        person_verification_id: c.personVerificationId,
        person_name: c.personName,
        contact_type: c.contactType,
        contact_value: c.contactValue,
        source_name: c.sourceName,
        source_url: c.sourceUrl,
        confidence_score: c.confidenceScore,
        verification_status: c.verificationStatus,
        notes: c.notes,
      }))
    );
  }

  if (propertyMedia.length > 0) {
    await supabase.from("property_media").insert(
      propertyMedia.map((m) => ({
        id: m.id,
        organization_id: orgId,
        lead_id: leadId,
        property_id: m.propertyId,
        media_type: m.mediaType,
        media_url: m.mediaUrl,
        source_name: m.sourceName,
        source_url: m.sourceUrl,
        attribution: m.attribution,
        retrieved_at: m.retrievedAt,
      }))
    );
  }
}

export async function fetchVerificationBundle(
  leadId: string,
  meta?: { propertyAddress: string; ownerName?: string | null; parcelId?: string | null }
): Promise<LeadVerificationBundle | null> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();

  const [hits, evidence, persons, contacts, media, logs] = await Promise.all([
    supabase.from("record_hits").select("*").eq("lead_id", leadId),
    supabase.from("evidence_sources").select("*").eq("lead_id", leadId).order("created_at"),
    supabase.from("person_verifications").select("*").eq("lead_id", leadId),
    supabase.from("contact_candidates").select("*").eq("lead_id", leadId),
    supabase.from("property_media").select("*").eq("lead_id", leadId),
    supabase.from("verification_action_logs").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }),
  ]);

  const recordHits = (hits.data ?? []).map((r) => mapRecordHit(r as Record<string, unknown>));
  const evidenceSources = annotateCitations(
    (evidence.data ?? []).map((r) => mapEvidence(r as Record<string, unknown>))
  );
  const personRows = (persons.data ?? []).map((r) => mapPerson(r as Record<string, unknown>));
  const contactCandidates = (contacts.data ?? []).map((r) => mapContact(r as Record<string, unknown>));
  const propertyMedia = (media.data ?? []).map((r) => mapMedia(r as Record<string, unknown>));
  const actionLogs = (logs.data ?? []).map((r) => mapActionLog(r as Record<string, unknown>));

  if (!meta && recordHits.length === 0 && personRows.length === 0) {
    return null;
  }

  return assembleVerificationBundle(leadId, {
    propertyAddress: meta?.propertyAddress ?? "",
    ownerName: meta?.ownerName,
    parcelId: meta?.parcelId,
    recordHits,
    evidenceSources,
    persons: personRows,
    contactCandidates,
    propertyMedia,
    actionLogs,
  });
}

export async function updatePersonVerification(
  leadId: string,
  personId: string,
  action: "approve" | "reject" | "needs_research",
  log: Omit<VerificationActionLog, "id" | "createdAt">
): Promise<PersonVerification | null> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (action === "approve") {
    updates.verification_status = "manually_approved";
    updates.role_label = "manually_approved";
    updates.approved_at = now;
    updates.approved_by = log.actorUserId;
  } else if (action === "reject") {
    updates.verification_status = "rejected";
    updates.rejected_at = now;
  } else {
    updates.verification_status = "needs_research";
  }
  if (log.notes) updates.notes = log.notes;

  const { data, error } = await supabase
    .from("person_verifications")
    .update(updates)
    .eq("id", personId)
    .eq("lead_id", leadId)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;

  await supabase.from("verification_action_logs").insert({
    organization_id: orgId,
    lead_id: leadId,
    actor_user_id: log.actorUserId,
    actor_user_name: log.actorUserName,
    action_type: log.actionType,
    target_type: log.targetType,
    target_id: personId,
    source_evidence_id: log.sourceEvidenceId,
    contact_method: log.contactMethod,
    notes: log.notes,
  });

  return mapPerson(data as Record<string, unknown>);
}

export async function updateContactCandidate(
  leadId: string,
  contactId: string,
  action: "approve" | "reject" | "needs_research",
  log: Omit<VerificationActionLog, "id" | "createdAt">
): Promise<ContactCandidate | null> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {};

  if (action === "approve") {
    updates.verification_status = "verified";
    updates.last_verified_at = now;
  } else if (action === "reject") {
    updates.verification_status = "rejected";
  } else {
    updates.verification_status = "unverified";
  }
  if (log.notes) updates.notes = log.notes;

  const { data, error } = await supabase
    .from("contact_candidates")
    .update(updates)
    .eq("id", contactId)
    .eq("lead_id", leadId)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;

  await supabase.from("verification_action_logs").insert({
    organization_id: orgId,
    lead_id: leadId,
    actor_user_id: log.actorUserId,
    actor_user_name: log.actorUserName,
    action_type: log.actionType,
    target_type: log.targetType,
    target_id: contactId,
    source_evidence_id: log.sourceEvidenceId,
    notes: log.notes,
  });

  return mapContact(data as Record<string, unknown>);
}

export async function insertActionLog(
  log: Omit<VerificationActionLog, "id" | "createdAt">
): Promise<void> {
  assertSupabaseConfigured();
  const orgId = await getCurrentOrganizationId();
  if (!orgId) return;

  const supabase = await createClient();
  await supabase.from("verification_action_logs").insert({
    organization_id: orgId,
    lead_id: log.leadId,
    actor_user_id: log.actorUserId,
    actor_user_name: log.actorUserName,
    action_type: log.actionType,
    target_type: log.targetType,
    target_id: log.targetId,
    source_evidence_id: log.sourceEvidenceId,
    contact_method: log.contactMethod,
    notes: log.notes,
  });
}
