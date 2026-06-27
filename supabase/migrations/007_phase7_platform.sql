-- Phase 7: SCS Nova Admin Console, Licensing, Billing, White Label
-- EstateLeadOS — Powered by SCS Nova

CREATE TABLE IF NOT EXISTS platform_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  owner_user_id UUID,
  seat_limit INTEGER NOT NULL DEFAULT 1,
  active_states JSONB DEFAULT '[]',
  active_counties JSONB DEFAULT '[]',
  monthly_lead_limit INTEGER,
  monthly_import_limit INTEGER,
  monthly_export_limit INTEGER,
  data_access_level TEXT DEFAULT 'basic',
  document_access_level TEXT DEFAULT 'checklist',
  compliance_level TEXT DEFAULT 'basic',
  buyer_network_access BOOLEAN NOT NULL DEFAULT false,
  assignment_tracker_access BOOLEAN NOT NULL DEFAULT false,
  billing_status TEXT NOT NULL DEFAULT 'trial',
  white_label_status BOOLEAN NOT NULL DEFAULT false,
  trial_status BOOLEAN NOT NULL DEFAULT true,
  account_status TEXT NOT NULL DEFAULT 'trial',
  renewal_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  seat_status TEXT NOT NULL DEFAULT 'active',
  account_status TEXT NOT NULL DEFAULT 'active',
  plan_access TEXT,
  active_states JSONB DEFAULT '[]',
  active_counties JSONB DEFAULT '[]',
  last_login_at TIMESTAMPTZ,
  invited_by UUID,
  mfa_placeholder TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT,
  city TEXT,
  zip TEXT,
  exclusive_placeholder BOOLEAN NOT NULL DEFAULT false,
  lead_volume_limit INTEGER,
  data_automation_access BOOLEAN NOT NULL DEFAULT false,
  csv_import_access BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  billing_reference_placeholder TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  billing_status TEXT NOT NULL DEFAULT 'trial',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  subscription_start_date DATE,
  renewal_date DATE,
  trial_end_date DATE,
  seats_purchased INTEGER NOT NULL DEFAULT 1,
  markets_licensed INTEGER NOT NULL DEFAULT 0,
  lead_packs_purchased INTEGER NOT NULL DEFAULT 0,
  payment_provider_customer_id_placeholder TEXT,
  payment_provider_subscription_id_placeholder TEXT,
  invoice_status TEXT,
  past_due_date DATE,
  cancellation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  related_plan_limit INTEGER,
  over_limit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  logo_url_placeholder TEXT,
  brand_color TEXT,
  accent_color TEXT,
  app_subtitle TEXT,
  login_screen_headline TEXT,
  login_screen_subheadline TEXT,
  email_footer_text TEXT,
  report_branding_text TEXT,
  document_header_text TEXT,
  custom_domain_placeholder TEXT,
  powered_by_scs_nova_visibility TEXT NOT NULL DEFAULT 'always_visible',
  approved_by_scs_nova BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  hashed_key_placeholder TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  rate_limit INTEGER NOT NULL DEFAULT 100,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  expiration_date DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  organization_id UUID NOT NULL REFERENCES platform_organizations(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  related_lead_id UUID,
  related_document_id UUID,
  related_state TEXT,
  related_county TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'new',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  assigned_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES platform_organizations(id) ON DELETE SET NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  related_module TEXT,
  related_record_id TEXT,
  previous_value TEXT,
  new_value TEXT,
  event_description TEXT NOT NULL,
  ip_device_placeholder TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  message TEXT,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  related_log_reference TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scs_nova_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL DEFAULT 'EstateLeadOS',
  powered_by_text TEXT NOT NULL DEFAULT 'Powered by SCS Nova',
  default_logo TEXT,
  default_accent_color TEXT,
  global_disclaimer_text TEXT NOT NULL,
  default_support_email_placeholder TEXT,
  default_support_phone_placeholder TEXT,
  default_billing_mode TEXT,
  demo_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  fresh_start_mode_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  default_data_retention_placeholder TEXT,
  terms_url_placeholder TEXT,
  privacy_url_placeholder TEXT,
  changelog_url_placeholder TEXT,
  roadmap_url_placeholder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_platform_users_org ON platform_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_market_licenses_org ON market_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_org ON billing_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_org ON platform_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_timestamp ON platform_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
