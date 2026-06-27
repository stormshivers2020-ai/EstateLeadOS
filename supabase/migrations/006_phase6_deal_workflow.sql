-- Phase 6: Deal Calculator, Buyer Network, Assignment Tracker
-- EstateLeadOS — Powered by SCS Nova

CREATE TABLE IF NOT EXISTS deal_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  created_by UUID,
  estimated_arv NUMERIC NOT NULL,
  estimated_current_value NUMERIC,
  tax_assessed_value NUMERIC,
  estimated_repairs NUMERIC NOT NULL DEFAULT 0,
  investor_discount_percentage NUMERIC NOT NULL DEFAULT 70,
  holding_costs NUMERIC NOT NULL DEFAULT 0,
  closing_costs NUMERIC NOT NULL DEFAULT 0,
  target_assignment_spread NUMERIC NOT NULL DEFAULT 0,
  risk_buffer NUMERIC NOT NULL DEFAULT 0,
  buyer_type TEXT,
  investor_max_offer NUMERIC,
  suggested_seller_offer NUMERIC,
  offer_range_low NUMERIC,
  offer_range_high NUMERIC,
  estimated_spread NUMERIC,
  confidence_level TEXT NOT NULL DEFAULT 'moderate',
  deal_potential_score INTEGER,
  notes TEXT,
  assumptions JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_potential_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  score_band TEXT NOT NULL,
  positive_factors JSONB DEFAULT '[]',
  negative_factors JSONB DEFAULT '[]',
  missing_data JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  confidence_level TEXT NOT NULL DEFAULT 'moderate',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_by UUID
);

CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  preferred_states JSONB DEFAULT '[]',
  preferred_counties JSONB DEFAULT '[]',
  preferred_cities JSONB DEFAULT '[]',
  preferred_zip_codes JSONB DEFAULT '[]',
  property_types JSONB DEFAULT '[]',
  max_price NUMERIC,
  minimum_spread NUMERIC,
  cash_buyer BOOLEAN NOT NULL DEFAULT false,
  proof_of_funds_on_file BOOLEAN NOT NULL DEFAULT false,
  proof_of_funds_status TEXT NOT NULL DEFAULT 'unknown',
  closing_speed TEXT,
  buy_box_notes TEXT,
  last_contacted TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  tags JSONB DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'manual_entry',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  buyers_created INTEGER NOT NULL DEFAULT 0,
  buyers_updated INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  missing_contact_info INTEGER NOT NULL DEFAULT 0,
  proof_of_funds_missing INTEGER NOT NULL DEFAULT 0,
  rows_requiring_review INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_band TEXT NOT NULL,
  why_matched JSONB DEFAULT '[]',
  missing_info JSONB DEFAULT '[]',
  proof_of_funds_status TEXT,
  last_contacted TIMESTAMPTZ,
  suggested_next_step TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  user_id UUID,
  contact_method TEXT NOT NULL,
  template_used_id TEXT,
  message_snapshot TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  buyer_id UUID REFERENCES buyers(id),
  seller_name TEXT,
  original_purchase_price NUMERIC,
  buyer_assignment_price NUMERIC,
  estimated_assignment_spread NUMERIC,
  actual_assignment_fee NUMERIC,
  earnest_money NUMERIC,
  title_company TEXT,
  closing_date DATE,
  required_disclosures JSONB DEFAULT '[]',
  signed_documents JSONB DEFAULT '[]',
  compliance_status TEXT NOT NULL DEFAULT 'not_started',
  attorney_title_review_status TEXT NOT NULL DEFAULT 'not_required',
  assignment_stage TEXT NOT NULL DEFAULT 'lead_under_contract',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_stage_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  user_id UUID,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  safety_status TEXT NOT NULL DEFAULT 'needs_review',
  disclosure_reminder_flag BOOLEAN NOT NULL DEFAULT true,
  assignment_risk_reminder_flag BOOLEAN NOT NULL DEFAULT false,
  review_status TEXT NOT NULL DEFAULT 'draft',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_workflow_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  lead_id UUID,
  assignment_id UUID,
  buyer_id UUID,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deal_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_matches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_deal_calculations_lead ON deal_calculations(lead_id);
CREATE INDEX IF NOT EXISTS idx_buyers_org ON buyers(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lead ON assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_assignments_stage ON assignments(assignment_stage);
CREATE INDEX IF NOT EXISTS idx_buyer_matches_lead ON buyer_matches(lead_id);
