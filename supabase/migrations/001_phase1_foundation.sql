-- EstateLeadOS Phase 1 Foundation Schema
-- Powered by SCS Nova

-- Enums
CREATE TYPE user_role AS ENUM (
  'solo_investor',
  'acquisition_manager',
  'team_member',
  'compliance_reviewer',
  'org_admin',
  'scs_nova_super_admin'
);

CREATE TYPE plan_id AS ENUM (
  'starter',
  'pro',
  'team',
  'market_license',
  'enterprise'
);

CREATE TYPE billing_status AS ENUM (
  'trial',
  'active',
  'past_due',
  'suspended',
  'cancelled'
);

CREATE TYPE module_status AS ENUM (
  'active',
  'placeholder',
  'coming_soon'
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_id plan_id NOT NULL DEFAULT 'starter',
  owner_id UUID REFERENCES auth.users(id),
  seats INTEGER NOT NULL DEFAULT 1,
  active_states TEXT[] DEFAULT '{}',
  active_counties TEXT[] DEFAULT '{}',
  monthly_lead_limit INTEGER,
  data_access_level TEXT DEFAULT 'basic',
  document_access_level TEXT DEFAULT 'basic',
  compliance_level TEXT DEFAULT 'standard',
  billing_status billing_status NOT NULL DEFAULT 'trial',
  white_label_status BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  renewal_date TIMESTAMPTZ
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'solo_investor',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription plan features (reference data)
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id plan_id NOT NULL UNIQUE,
  states_limit INTEGER,
  monthly_leads_limit INTEGER,
  seats_limit INTEGER,
  deal_calculator BOOLEAN DEFAULT false,
  outreach_tools BOOLEAN DEFAULT false,
  state_deal_kits BOOLEAN DEFAULT false,
  buyer_network BOOLEAN DEFAULT false,
  assignment_tracker BOOLEAN DEFAULT false,
  audit_trail BOOLEAN DEFAULT false,
  advanced_reporting BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- States (nationwide support)
CREATE TABLE states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation CHAR(2) NOT NULL UNIQUE,
  supported_status TEXT NOT NULL DEFAULT 'research_only',
  compliance_review_status TEXT DEFAULT 'pending',
  last_reviewed_at TIMESTAMPTZ,
  licensing_risk_level TEXT DEFAULT 'unknown',
  data_availability_rating INTEGER DEFAULT 0,
  risk_rating TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Counties
CREATE TABLE counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fips_code TEXT,
  supported_status TEXT NOT NULL DEFAULT 'unavailable',
  data_source_status TEXT DEFAULT 'manual_upload_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(state_id, name)
);

-- Data sources (permission/status aware — Phase 2)
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  state TEXT,
  county TEXT,
  access_method TEXT NOT NULL,
  access_status TEXT NOT NULL DEFAULT 'blocked',
  terms_status TEXT DEFAULT 'pending',
  last_checked_at TIMESTAMPTZ,
  data_reliability_score INTEGER DEFAULT 0,
  data_freshness_score INTEGER DEFAULT 0,
  source_url TEXT,
  notes TEXT,
  legal_access_warning TEXT,
  admin_approval_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads (base schema — expanded in Phase 2)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_address TEXT,
  owner_name TEXT,
  state TEXT,
  county TEXT,
  city TEXT,
  zip_code TEXT,
  parcel_id TEXT,
  lead_type TEXT,
  estate_lead_score INTEGER DEFAULT 0,
  deal_potential_score INTEGER DEFAULT 0,
  compliance_risk_score INTEGER DEFAULT 0,
  data_confidence_score INTEGER DEFAULT 0,
  pipeline_status TEXT DEFAULT 'new_lead',
  assigned_user_id UUID REFERENCES profiles(id),
  next_action TEXT,
  source_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents (base schema — expanded in Phase 5)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,
  state TEXT,
  status TEXT DEFAULT 'not_started',
  version INTEGER DEFAULT 1,
  required BOOLEAN DEFAULT true,
  attorney_review_flag BOOLEAN DEFAULT false,
  signature_needed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Module registry
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phase INTEGER NOT NULL,
  status module_status NOT NULL DEFAULT 'placeholder',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed plan features
INSERT INTO plan_features (plan_id, states_limit, monthly_leads_limit, seats_limit, deal_calculator, outreach_tools, state_deal_kits, buyer_network, assignment_tracker, audit_trail, advanced_reporting, api_access, white_label)
VALUES
  ('starter', 3, 100, 1, false, false, false, false, false, false, false, false, false),
  ('pro', 15, 500, 1, true, true, true, false, false, false, false, false, false),
  ('team', 30, 2000, 10, true, true, true, true, true, true, true, false, false),
  ('market_license', 50, 10000, 25, true, true, true, true, true, true, true, false, false),
  ('enterprise', 50, NULL, NULL, true, true, true, true, true, true, true, true, true);

-- Seed module registry
INSERT INTO modules (id, name, phase, status, description) VALUES
  ('dashboard', 'Dashboard', 1, 'active', 'Operational overview and pipeline metrics'),
  ('lead-discovery', 'Lead Discovery Engine', 2, 'placeholder', 'Public-record connectors and CSV import'),
  ('market-search', 'Market Search', 2, 'placeholder', 'Nationwide market filters and search'),
  ('lead-feed', 'Lead Feed', 2, 'placeholder', 'Scored estate and inherited property leads'),
  ('state-deal-kits', 'State Deal Kits', 3, 'placeholder', 'State workflows, equipment, and documents'),
  ('compliance-engine', 'Compliance Rules Engine', 3, 'placeholder', 'State compliance rules and workflow blockers'),
  ('lead-detail', 'Lead Detail & CRM Pipeline', 4, 'placeholder', 'Lead intelligence and pipeline stages'),
  ('outreach-crm', 'Outreach CRM', 4, 'placeholder', 'Respectful outreach templates and logs'),
  ('document-center', 'Document Center', 5, 'placeholder', 'Templates, generators, and document workflow'),
  ('deal-calculator', 'Deal Calculator', 6, 'placeholder', 'Estimated offer ranges and deal potential'),
  ('buyer-network', 'Buyer Network', 6, 'placeholder', 'Buyer matching and disposition'),
  ('assignment-tracker', 'Assignment Tracker', 6, 'placeholder', 'Assignment and closing workflow'),
  ('admin-console', 'SCS Nova Admin Console', 7, 'placeholder', 'Platform administration and licensing'),
  ('billing', 'Billing & Subscriptions', 7, 'placeholder', 'Stripe-ready subscription architecture'),
  ('audit-trail', 'Audit Trail', 7, 'placeholder', 'Activity and compliance audit logging'),
  ('reports', 'Reports', 6, 'placeholder', 'Pipeline and performance reporting');

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organizations: members can view their org
CREATE POLICY "Org members can view organization"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

-- Leads: org isolation
CREATE POLICY "Org members can view leads"
  ON leads FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

CREATE POLICY "Org members can insert leads"
  ON leads FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org members can update leads"
  ON leads FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Documents: org isolation
CREATE POLICY "Org members can view documents"
  ON documents FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

-- Audit logs: org isolation
CREATE POLICY "Org members can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

-- States and counties are public reference data
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view states"
  ON states FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can view counties"
  ON counties FOR SELECT
  TO authenticated
  USING (true);

-- Super admin policies for data sources
CREATE POLICY "Super admins manage data sources"
  ON data_sources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin')
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
