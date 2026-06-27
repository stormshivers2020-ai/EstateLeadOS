-- EstateLeadOS Attorney Review + Buyer Distribution Workflow

CREATE TABLE attorney_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID,
  attorney_name TEXT,
  attorney_firm TEXT,
  attorney_email TEXT,
  attorney_phone TEXT,
  review_status TEXT NOT NULL DEFAULT 'not_started',
  review_requested_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_notes TEXT,
  changes_requested TEXT,
  approved_file_url TEXT,
  signed_review_letter_url TEXT,
  attorney_engagement_file_url TEXT,
  attorney_fee_agreement_file_url TEXT,
  proposed_attorney_fee_type TEXT,
  proposed_attorney_fee_percentage NUMERIC,
  proposed_attorney_flat_fee NUMERIC,
  attorney_fee_status TEXT NOT NULL DEFAULT 'not_discussed',
  attorney_approval_notes TEXT,
  attorney_review_file_html TEXT,
  manual_override_acknowledged BOOLEAN NOT NULL DEFAULT false,
  manual_override_at TIMESTAMPTZ,
  manual_override_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id)
);

CREATE TABLE attorney_review_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  attorney_review_id UUID NOT NULL REFERENCES attorney_reviews(id) ON DELETE CASCADE,
  packet_id UUID,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  document_category TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  review_status TEXT
);

CREATE TABLE attorney_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attorney_review_id UUID NOT NULL REFERENCES attorney_reviews(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  compensation_type TEXT NOT NULL DEFAULT 'not_set',
  proposed_percentage NUMERIC,
  proposed_flat_fee NUMERIC,
  paid_from_assignment_fee BOOLEAN NOT NULL DEFAULT false,
  payment_due_condition TEXT NOT NULL DEFAULT 'not_set',
  written_agreement_uploaded BOOLEAN NOT NULL DEFAULT false,
  agreement_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'not_discussed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE distribution_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source_packet_id UUID,
  attorney_review_id UUID REFERENCES attorney_reviews(id) ON DELETE SET NULL,
  packet_type TEXT NOT NULL,
  packet_status TEXT NOT NULL DEFAULT 'draft',
  packet_version INTEGER NOT NULL DEFAULT 1,
  redaction_checklist JSONB DEFAULT '[]',
  attorney_review_status TEXT,
  user_approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_to_send_at TIMESTAMPTZ,
  approved_by TEXT,
  printable_html TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  distribution_packet_id UUID NOT NULL REFERENCES distribution_packets(id) ON DELETE CASCADE,
  recipient_id UUID,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_urls TEXT[] DEFAULT '{}',
  send_status TEXT NOT NULL DEFAULT 'draft',
  provider TEXT,
  provider_message_id TEXT,
  simulated BOOLEAN NOT NULL DEFAULT false,
  sent_by TEXT,
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  user_approved_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE external_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  recipient_type TEXT NOT NULL DEFAULT 'investor',
  market_area TEXT,
  buyer_criteria TEXT,
  proof_of_funds_status TEXT NOT NULL DEFAULT 'unknown',
  contact_permission_status TEXT NOT NULL DEFAULT 'unknown',
  last_contacted_at TIMESTAMPTZ,
  packet_sent_count INTEGER NOT NULL DEFAULT 0,
  response_status TEXT NOT NULL DEFAULT 'not_contacted',
  notes TEXT,
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE distribution_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  related_recipient_id UUID,
  related_attorney_review_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attorney_reviews_lead ON attorney_reviews(lead_id);
CREATE INDEX idx_distribution_packets_lead ON distribution_packets(lead_id);
CREATE INDEX idx_email_distributions_lead ON email_distributions(lead_id);
CREATE INDEX idx_distribution_audit_lead ON distribution_audit_logs(lead_id);

ALTER TABLE attorney_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_review_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_audit_logs ENABLE ROW LEVEL SECURITY;
