-- Phase 5: Document Center, Template Library, and Document Workflow
-- EstateLeadOS — Powered by SCS Nova

-- Document Types (SCS Nova master definitions)
CREATE TABLE IF NOT EXISTS document_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  requirement_logic TEXT NOT NULL DEFAULT 'conditional',
  state_specific BOOLEAN NOT NULL DEFAULT false,
  county_specific BOOLEAN NOT NULL DEFAULT false,
  deal_type_specific BOOLEAN NOT NULL DEFAULT true,
  workflow_stage_specific BOOLEAN NOT NULL DEFAULT true,
  attorney_review_flag BOOLEAN NOT NULL DEFAULT false,
  signature_needed_flag BOOLEAN NOT NULL DEFAULT false,
  upload_allowed BOOLEAN NOT NULL DEFAULT true,
  generate_allowed BOOLEAN NOT NULL DEFAULT true,
  version_required BOOLEAN NOT NULL DEFAULT true,
  expiration_logic TEXT,
  disclaimer_required BOOLEAN NOT NULL DEFAULT true,
  audit_required BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Templates (SCS Nova master + org-level)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  document_type_id TEXT REFERENCES document_types(id),
  category TEXT NOT NULL,
  state_id TEXT,
  county_id TEXT,
  deal_type TEXT,
  required_plan TEXT,
  variables JSONB NOT NULL DEFAULT '[]',
  body TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft',
  last_reviewed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  attorney_reviewed BOOLEAN NOT NULL DEFAULT false,
  attorney_review_notes TEXT,
  internal_notes TEXT,
  purpose TEXT,
  checklist_items JSONB DEFAULT '[]',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Records (organization-owned)
CREATE TABLE IF NOT EXISTS document_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  state_abbreviation TEXT,
  county_name TEXT,
  deal_type TEXT,
  workflow_stage TEXT,
  document_name TEXT NOT NULL,
  document_type_id TEXT REFERENCES document_types(id),
  document_category TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  status TEXT NOT NULL DEFAULT 'not_started',
  required_status TEXT NOT NULL DEFAULT 'conditional',
  required_reason TEXT,
  attorney_review_flag BOOLEAN NOT NULL DEFAULT false,
  attorney_review_status TEXT NOT NULL DEFAULT 'not_required',
  signature_needed_flag BOOLEAN NOT NULL DEFAULT false,
  signature_status TEXT NOT NULL DEFAULT 'not_required',
  source_fields_used JSONB DEFAULT '[]',
  template_id UUID REFERENCES document_templates(id),
  template_version INTEGER,
  file_url TEXT,
  uploaded_file_reference TEXT,
  generated_content_snapshot TEXT,
  disclaimer TEXT,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Variables Registry
CREATE TABLE IF NOT EXISTS document_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  source_module TEXT NOT NULL,
  source_field TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  fallback_allowed BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Generation Runs
CREATE TABLE IF NOT EXISTS document_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  document_record_id UUID REFERENCES document_records(id),
  template_id UUID REFERENCES document_templates(id),
  generated_by UUID,
  variables_used JSONB DEFAULT '{}',
  missing_variables JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'complete',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Document Packets
CREATE TABLE IF NOT EXISTS lead_document_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  state_abbreviation TEXT NOT NULL,
  county_name TEXT,
  deal_type TEXT NOT NULL,
  packet_status TEXT NOT NULL DEFAULT 'not_started',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  missing_documents JSONB DEFAULT '[]',
  attorney_review_items JSONB DEFAULT '[]',
  signed_document_items JSONB DEFAULT '[]',
  uploaded_document_items JSONB DEFAULT '[]',
  generated_document_items JSONB DEFAULT '[]',
  source_record_items JSONB DEFAULT '[]',
  audit_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded Documents
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  uploaded_by UUID,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  document_category TEXT,
  document_type_id TEXT REFERENCES document_types(id),
  state_abbreviation TEXT,
  county_name TEXT,
  deal_type TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  attorney_review_flag BOOLEAN NOT NULL DEFAULT false,
  signature_needed_flag BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signed Document Tracking
CREATE TABLE IF NOT EXISTS signed_document_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_record_id UUID NOT NULL REFERENCES document_records(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID,
  signature_status TEXT NOT NULL DEFAULT 'not_required',
  signer_name TEXT,
  signer_role TEXT,
  sent_date TIMESTAMPTZ,
  signed_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  e_signature_provider_placeholder TEXT,
  uploaded_signed_copy TEXT,
  verification_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attorney Review Queue
CREATE TABLE IF NOT EXISTS attorney_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  document_record_id UUID REFERENCES document_records(id),
  state_abbreviation TEXT,
  county_name TEXT,
  deal_type TEXT,
  risk_level TEXT,
  review_reason TEXT NOT NULL,
  template_review_status TEXT,
  document_status TEXT,
  assigned_reviewer TEXT,
  review_status TEXT NOT NULL DEFAULT 'recommended',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Audit Logs
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  lead_id UUID,
  document_record_id UUID REFERENCES document_records(id),
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document Workflow Blockers
CREATE TABLE IF NOT EXISTS document_workflow_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  document_record_id UUID REFERENCES document_records(id),
  workflow_stage TEXT NOT NULL,
  blocker_type TEXT NOT NULL,
  blocker_message TEXT NOT NULL,
  required_action TEXT,
  severity TEXT NOT NULL DEFAULT 'high',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- RLS: organization isolation
ALTER TABLE document_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_document_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_blockers ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_records_org ON document_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_records_lead ON document_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_document_records_status ON document_records(status);
CREATE INDEX IF NOT EXISTS idx_lead_document_packets_lead ON lead_document_packets(lead_id);
CREATE INDEX IF NOT EXISTS idx_attorney_review_items_org ON attorney_review_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_blockers_lead ON document_workflow_blockers(lead_id);
