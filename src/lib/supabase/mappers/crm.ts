import type {
  CommunicationLog,
  FollowUpReminder,
  LeadNote,
  ContactMethod,
  CommunicationOutcome,
  ConsentStatus,
  NoteType,
} from "@/lib/types/crm";

export interface CommunicationLogRow {
  id: string;
  lead_id: string;
  organization_id: string;
  user_id: string;
  communication_date: string;
  communication_time: string | null;
  contact_method: string;
  contact_person: string | null;
  contact_role: string | null;
  template_used_id: string | null;
  message_body_snapshot: string;
  outcome: string | null;
  follow_up_date: string | null;
  consent_status: string | null;
  dnc_status: boolean | null;
  state_outreach_warning_reviewed: boolean | null;
  dnc_reminder_acknowledged: boolean | null;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
}

export interface LeadNoteRow {
  id: string;
  lead_id: string;
  organization_id: string;
  user_id: string;
  note_type: string;
  body: string;
  visibility: string | null;
  pinned: boolean | null;
  edited: boolean | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; email: string } | null;
}

export interface FollowUpRow {
  id: string;
  lead_id: string;
  organization_id: string;
  assigned_user_id: string | null;
  follow_up_date: string;
  follow_up_time: string | null;
  follow_up_method: string | null;
  reason: string | null;
  priority: string | null;
  status: string | null;
  related_communication_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  leads?: { property_address: string | null } | null;
  profiles?: { full_name: string | null; email: string } | null;
}

function profileName(p: { full_name: string | null; email: string } | null | undefined, fallback = "User") {
  return p?.full_name ?? p?.email?.split("@")[0] ?? fallback;
}

export function mapCommunicationLog(row: CommunicationLogRow): CommunicationLog {
  return {
    id: row.id,
    leadId: row.lead_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    userName: profileName(row.profiles),
    communicationDate: row.communication_date,
    communicationTime: row.communication_time ?? "12:00",
    contactMethod: row.contact_method as ContactMethod,
    contactPerson: row.contact_person ?? "Property Owner",
    contactRole: (row.contact_role ?? "owner") as CommunicationLog["contactRole"],
    templateUsedId: row.template_used_id,
    templateUsedName: null,
    messageBodySnapshot: row.message_body_snapshot,
    outcome: (row.outcome ?? "internal_note_only") as CommunicationOutcome,
    followUpDate: row.follow_up_date,
    consentStatus: (row.consent_status ?? "unknown") as ConsentStatus,
    dncStatus: row.dnc_status ?? false,
    stateOutreachWarningReviewed: row.state_outreach_warning_reviewed ?? true,
    dncReminderAcknowledged: row.dnc_reminder_acknowledged ?? true,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapLeadNote(row: LeadNoteRow): LeadNote {
  return {
    id: row.id,
    leadId: row.lead_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    userName: profileName(row.profiles),
    noteType: row.note_type as NoteType,
    body: row.body,
    visibility: row.visibility ?? "internal_team",
    pinned: row.pinned ?? false,
    edited: row.edited ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFollowUp(row: FollowUpRow): FollowUpReminder {
  return {
    id: row.id,
    leadId: row.lead_id,
    organizationId: row.organization_id,
    assignedUserId: row.assigned_user_id ?? "",
    assignedUserName: profileName(row.profiles),
    propertyAddress: row.leads?.property_address ?? "—",
    followUpDate: row.follow_up_date,
    followUpTime: row.follow_up_time,
    followUpMethod: (row.follow_up_method ?? "call") as ContactMethod,
    reason: row.reason ?? "Follow-up scheduled",
    priority: (row.priority ?? "normal") as FollowUpReminder["priority"],
    status: (row.status ?? "scheduled") as FollowUpReminder["status"],
    relatedCommunicationId: row.related_communication_id,
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
