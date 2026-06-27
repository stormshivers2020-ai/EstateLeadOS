-- EstateLeadOS Phase 4 — CRM Pipeline & Outreach Center

CREATE TYPE crm_pipeline_stage AS ENUM (
  'new_lead', 'needs_research', 'researching', 'contact_ready',
  'first_outreach_sent', 'follow_up_needed', 'conversation_started',
  'interested', 'appointment_set', 'offer_research', 'offer_sent',
  'negotiating', 'under_contract', 'compliance_review', 'buyer_matching',
  'assignment_sent', 'closing_scheduled', 'closed_won', 'closed_lost',
  'dead_lead', 'do_not_contact'
);

CREATE TYPE contact_method AS ENUM (
  'call', 'voicemail', 'sms', 'email', 'direct_mail', 'postcard',
  'in_person', 'title_company', 'buyer_contact', 'internal_note'
);

CREATE TYPE communication_outcome AS ENUM (
  'no_answer', 'left_voicemail', 'sent_message', 'sent_letter',
  'conversation_started', 'interested', 'not_interested', 'follow_up_requested',
  'appointment_set', 'wrong_contact', 'do_not_contact', 'needs_research',
  'undeliverable', 'bounced', 'internal_note_only'
);

CREATE TYPE consent_status AS ENUM (
  'unknown', 'not_applicable', 'consent_needed', 'consent_recorded',
  'opted_out', 'do_not_contact', 'manual_review_required'
);

CREATE TYPE outreach_safety_status AS ENUM (
  'approved', 'needs_review', 'blocked', 'requires_compliance_review',
  'requires_state_warning', 'requires_user_acknowledgement'
);

CREATE TABLE pipeline_stages (
  id crm_pipeline_stage PRIMARY KEY,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_description TEXT,
  required_actions JSONB DEFAULT '[]',
  suggested_next_step TEXT,
  blockers JSONB DEFAULT '[]',
  documents_needed JSONB DEFAULT '[]',
  compliance_checks JSONB DEFAULT '[]',
  allowed_previous_stages JSONB DEFAULT '[]',
  allowed_next_stages JSONB DEFAULT '[]',
  completion_criteria TEXT,
  requires_compliance_clearance BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_pipeline_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_stage crm_pipeline_stage NOT NULL DEFAULT 'new_lead',
  previous_stage crm_pipeline_stage,
  assigned_user_id UUID REFERENCES profiles(id),
  next_action TEXT,
  follow_up_date DATE,
  last_contact_date DATE,
  stage_changed_at TIMESTAMPTZ,
  stage_changed_by UUID REFERENCES profiles(id),
  do_not_contact BOOLEAN DEFAULT false,
  dnc_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

CREATE TABLE pipeline_stage_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  from_stage crm_pipeline_stage,
  to_stage crm_pipeline_stage NOT NULL,
  allowed BOOLEAN NOT NULL,
  blocked_reason TEXT,
  compliance_check_result_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  channel contact_method NOT NULL,
  state_applicability JSONB DEFAULT '["*"]',
  deal_type_applicability JSONB DEFAULT '["*"]',
  tone TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  required_disclaimer_flag BOOLEAN DEFAULT true,
  dnc_reminder_flag BOOLEAN DEFAULT true,
  consent_reminder_flag BOOLEAN DEFAULT false,
  safety_status outreach_safety_status DEFAULT 'approved',
  review_status TEXT DEFAULT 'pending',
  last_reviewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outreach_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES outreach_templates(id),
  lead_id UUID REFERENCES leads(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  content_snapshot TEXT,
  safety_status outreach_safety_status,
  flagged_phrases JSONB DEFAULT '[]',
  risk_reasons JSONB DEFAULT '[]',
  suggested_rewrite TEXT,
  blocked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  communication_date DATE NOT NULL,
  communication_time TIME,
  contact_method contact_method NOT NULL,
  contact_person TEXT,
  contact_role TEXT,
  template_used_id UUID REFERENCES outreach_templates(id),
  message_body_snapshot TEXT NOT NULL,
  outcome communication_outcome,
  follow_up_date DATE,
  consent_status consent_status DEFAULT 'unknown',
  dnc_status BOOLEAN DEFAULT false,
  state_outreach_warning_reviewed BOOLEAN DEFAULT false,
  dnc_reminder_acknowledged BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES profiles(id),
  follow_up_date DATE NOT NULL,
  follow_up_time TIME,
  follow_up_method contact_method,
  reason TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'scheduled',
  related_communication_id UUID REFERENCES communication_logs(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE do_not_contact_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_person TEXT,
  contact_method TEXT,
  reason TEXT NOT NULL,
  source TEXT,
  set_by_user_id UUID REFERENCES profiles(id),
  set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  removed_by_user_id UUID REFERENCES profiles(id),
  removed_at TIMESTAMPTZ,
  removal_reason TEXT
);

CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  note_type TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT DEFAULT 'internal_team',
  pinned BOOLEAN DEFAULT false,
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blocked_outreach_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase TEXT NOT NULL,
  severity TEXT NOT NULL,
  reason TEXT,
  suggested_alternative TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE lead_pipeline_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE do_not_contact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_safety_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation for pipeline states"
  ON lead_pipeline_states FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Org isolation for communication logs"
  ON communication_logs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Org isolation for follow-ups"
  ON follow_up_reminders FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Org isolation for DNC records"
  ON do_not_contact_records FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Org isolation for notes"
  ON lead_notes FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "View global or org outreach templates"
  ON outreach_templates FOR SELECT
  USING (organization_id IS NULL OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Super admin manages global templates"
  ON outreach_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

CREATE POLICY "Super admin manages blocked phrases"
  ON blocked_outreach_phrases FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));
