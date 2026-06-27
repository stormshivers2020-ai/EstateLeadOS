-- EstateLeadOS Program Completion: packets, archive, required documents, assignment readiness, review queue

CREATE TABLE lead_program_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_type TEXT NOT NULL,
  packet_status TEXT NOT NULL DEFAULT 'draft',
  packet_version INTEGER NOT NULL DEFAULT 1,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  printable_html TEXT,
  pdf_url TEXT,
  archive_url TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  assignment_readiness_status TEXT NOT NULL DEFAULT 'not_started',
  buyer_review_status TEXT NOT NULL DEFAULT 'not_started',
  payout_readiness_status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_program_packets_lead ON lead_program_packets(lead_id);
CREATE INDEX idx_lead_program_packets_status ON lead_program_packets(packet_status);

CREATE TABLE lead_packet_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES lead_program_packets(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  section_title TEXT NOT NULL,
  section_status TEXT NOT NULL DEFAULT 'not_started',
  section_content TEXT,
  source_evidence_ids UUID[] DEFAULT '{}',
  missing_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID NOT NULL REFERENCES lead_program_packets(id) ON DELETE CASCADE,
  archive_status TEXT NOT NULL DEFAULT 'ready_for_review',
  archive_type TEXT NOT NULL,
  archived_by TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archive_notes TEXT,
  print_count INTEGER NOT NULL DEFAULT 0,
  last_printed_at TIMESTAMPTZ,
  county_name TEXT,
  state_abbr TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_archives_lead ON lead_archives(lead_id);
CREATE INDEX idx_lead_archives_status ON lead_archives(archive_status);

CREATE TABLE required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  source_name TEXT,
  source_url TEXT,
  evidence_source_id UUID REFERENCES evidence_sources(id) ON DELETE SET NULL,
  uploaded_file_url TEXT,
  required_for_packet BOOLEAN NOT NULL DEFAULT true,
  required_for_assignment_review BOOLEAN NOT NULL DEFAULT false,
  required_for_buyer_review BOOLEAN NOT NULL DEFAULT false,
  why_it_matters TEXT,
  where_to_look_next TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id, document_type)
);

CREATE TABLE assignment_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID REFERENCES lead_program_packets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  target_assignment_fee NUMERIC,
  minimum_acceptable_spread NUMERIC,
  buyer_match_id UUID,
  buyer_proof_of_funds_status TEXT NOT NULL DEFAULT 'not_checked',
  title_company_status TEXT NOT NULL DEFAULT 'not_entered',
  disclosure_checklist_status TEXT NOT NULL DEFAULT 'not_reviewed',
  attorney_review_status TEXT NOT NULL DEFAULT 'not_reviewed',
  signed_document_status TEXT NOT NULL DEFAULT 'not_started',
  compliance_blockers_clear BOOLEAN NOT NULL DEFAULT false,
  payout_readiness_status TEXT NOT NULL DEFAULT 'not_started',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id)
);

CREATE TABLE review_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID REFERENCES lead_program_packets(id) ON DELETE SET NULL,
  queue_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  next_action TEXT NOT NULL,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  missing_document_count INTEGER NOT NULL DEFAULT 0,
  county_name TEXT,
  state_abbr TEXT,
  current_stage TEXT,
  confidence_score INTEGER,
  packet_status TEXT,
  lead_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_queue_type ON review_queue_items(queue_type);
CREATE INDEX idx_review_queue_status ON review_queue_items(status);

CREATE TABLE packet_print_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID NOT NULL REFERENCES lead_program_packets(id) ON DELETE CASCADE,
  printed_by TEXT NOT NULL,
  printed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  print_type TEXT NOT NULL DEFAULT 'browser',
  notes TEXT
);

ALTER TABLE lead_program_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_packet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packet_print_logs ENABLE ROW LEVEL SECURITY;
