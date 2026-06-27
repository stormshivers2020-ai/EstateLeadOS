-- EstateLeadOS Phase 3 — State Deal Kits & Compliance Rules Engine

CREATE TYPE state_support_status AS ENUM (
  'fully_supported', 'partially_supported', 'research_only',
  'manual_upload_only', 'coming_soon', 'unavailable', 'restricted', 'attorney_review_required'
);

CREATE TYPE county_support_status AS ENUM (
  'api_supported', 'approved_manual', 'csv_import_supported',
  'manual_upload_only', 'research_only', 'coming_soon', 'unavailable', 'blocked', 'unknown'
);

CREATE TYPE risk_rating AS ENUM (
  'low', 'moderate', 'elevated', 'high', 'restricted', 'attorney_review_required'
);

CREATE TYPE deal_type AS ENUM (
  'direct_purchase', 'assignment_of_contract', 'double_closing',
  'referral_to_licensed_agent', 'hold_for_rental', 'buyer_network_disposition', 'needs_attorney_review'
);

CREATE TYPE checklist_item_status AS ENUM (
  'not_started', 'in_progress', 'complete', 'not_required', 'blocked', 'needs_review'
);

CREATE TYPE document_checklist_status AS ENUM (
  'not_started', 'generated', 'uploaded', 'sent', 'signed', 'reviewed',
  'needs_attorney_review', 'expired', 'not_required', 'unknown'
);

CREATE TYPE blocker_severity AS ENUM ('info', 'warning', 'elevated', 'blocking', 'restricted');
CREATE TYPE blocker_status AS ENUM (
  'active', 'resolved', 'acknowledged', 'not_required', 'overridden_by_admin', 'attorney_review_acknowledged'
);

-- State profiles (SCS Nova master data)
CREATE TABLE state_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name TEXT NOT NULL,
  state_abbreviation CHAR(2) NOT NULL UNIQUE,
  supported_status state_support_status NOT NULL DEFAULT 'research_only',
  compliance_review_status TEXT DEFAULT 'not_reviewed',
  last_reviewed_at TIMESTAMPTZ,
  legal_source_links JSONB DEFAULT '[]',
  attorney_review_status TEXT DEFAULT 'not_reviewed',
  wholesaling_disclosure_notes TEXT,
  assignment_contract_notes TEXT,
  marketing_contract_interest_warning TEXT,
  licensing_risk_level risk_rating DEFAULT 'moderate',
  seller_disclosure_checklist JSONB DEFAULT '[]',
  buyer_assignee_disclosure_checklist JSONB DEFAULT '[]',
  required_forms_checklist JSONB DEFAULT '[]',
  recommended_professional_contacts JSONB DEFAULT '[]',
  title_company_notes TEXT,
  recording_office_notes TEXT,
  probate_court_access_notes TEXT,
  county_source_coverage TEXT,
  data_availability_rating TEXT DEFAULT 'unknown',
  risk_rating risk_rating DEFAULT 'moderate',
  user_warnings JSONB DEFAULT '[]',
  outreach_caution TEXT,
  recording_consent_reminder TEXT,
  call_text_restrictions TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE county_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_profile_id UUID NOT NULL REFERENCES state_profiles(id) ON DELETE CASCADE,
  county_name TEXT NOT NULL,
  supported_status county_support_status NOT NULL DEFAULT 'unknown',
  data_source_coverage TEXT,
  recorder_access_status TEXT,
  tax_assessor_access_status TEXT,
  probate_court_access_status TEXT,
  register_of_wills_access_status TEXT,
  public_notice_access_status TEXT,
  manual_upload_availability BOOLEAN DEFAULT true,
  data_reliability_score INTEGER DEFAULT 0,
  data_freshness_score INTEGER DEFAULT 0,
  county_risk_rating risk_rating DEFAULT 'moderate',
  county_notes TEXT,
  source_links JSONB DEFAULT '[]',
  last_reviewed_at TIMESTAMPTZ,
  admin_approval_status TEXT DEFAULT 'pending',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_profile_id, county_name)
);

CREATE TABLE state_deal_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  state_profile_id UUID NOT NULL REFERENCES state_profiles(id),
  county_profile_id UUID REFERENCES county_profiles(id),
  deal_type deal_type NOT NULL,
  user_role TEXT,
  acquisition_strategy TEXT,
  risk_level risk_rating,
  support_status state_support_status,
  checklist_config JSONB DEFAULT '{}',
  source_links JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE equipment_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_deal_kit_id UUID NOT NULL REFERENCES state_deal_kits(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  requirement_level TEXT DEFAULT 'required',
  state_specific BOOLEAN DEFAULT false,
  deal_type_specific JSONB DEFAULT '[]',
  status TEXT DEFAULT 'not_started',
  notes TEXT,
  blocking_status BOOLEAN DEFAULT false,
  acknowledgement_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_deal_kit_id UUID NOT NULL REFERENCES state_deal_kits(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_category TEXT,
  requirement_level TEXT DEFAULT 'required',
  required_by_state BOOLEAN DEFAULT false,
  required_by_deal_type JSONB DEFAULT '[]',
  required_by_workflow_stage JSONB DEFAULT '[]',
  attorney_review_flag BOOLEAN DEFAULT false,
  signature_needed_flag BOOLEAN DEFAULT false,
  upload_allowed BOOLEAN DEFAULT true,
  generate_allowed BOOLEAN DEFAULT true,
  current_status document_checklist_status DEFAULT 'not_started',
  blocking_status BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_profile_id UUID REFERENCES state_profiles(id),
  county_profile_id UUID REFERENCES county_profiles(id),
  rule_name TEXT NOT NULL,
  rule_category TEXT,
  deal_type deal_type,
  acquisition_strategy TEXT,
  trigger_condition TEXT,
  risk_level risk_rating,
  required_action TEXT,
  blocker_rule BOOLEAN DEFAULT false,
  acknowledgement_required BOOLEAN DEFAULT false,
  attorney_review_recommended BOOLEAN DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  state_profile_id UUID REFERENCES state_profiles(id),
  county_profile_id UUID REFERENCES county_profiles(id),
  workflow_stage TEXT NOT NULL,
  blocker_type TEXT NOT NULL,
  blocker_message TEXT NOT NULL,
  required_action TEXT,
  severity blocker_severity NOT NULL DEFAULT 'blocking',
  status blocker_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id)
);

CREATE TABLE compliance_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  state_profile_id UUID REFERENCES state_profiles(id),
  county_profile_id UUID REFERENCES county_profiles(id),
  acknowledgement_type TEXT NOT NULL,
  acknowledgement_text TEXT NOT NULL,
  related_risk_level risk_rating,
  related_workflow_stage TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_placeholder TEXT,
  version TEXT DEFAULT '1.0',
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE compliance_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  state_profile_id UUID REFERENCES state_profiles(id),
  county_profile_id UUID REFERENCES county_profiles(id),
  deal_type deal_type,
  acquisition_strategy TEXT,
  risk_level risk_rating,
  required_actions JSONB DEFAULT '[]',
  required_acknowledgements JSONB DEFAULT '[]',
  active_blockers JSONB DEFAULT '[]',
  allowed_stages JSONB DEFAULT '[]',
  blocked_stages JSONB DEFAULT '[]',
  explanation TEXT,
  answers JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_by UUID REFERENCES profiles(id)
);

CREATE TABLE compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  risk_level risk_rating,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE state_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE county_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_deal_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view state profiles"
  ON state_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view county profiles"
  ON county_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Org members can view deal kits"
  ON state_deal_kits FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR organization_id IS NULL
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

CREATE POLICY "Org isolation for workflow blockers"
  ON workflow_blockers FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

CREATE POLICY "Org isolation for acknowledgements"
  ON compliance_acknowledgements FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

CREATE POLICY "Super admin manages compliance rules"
  ON compliance_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

CREATE POLICY "Super admin manages state profiles"
  ON state_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

CREATE POLICY "Super admin manages county profiles"
  ON county_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));
