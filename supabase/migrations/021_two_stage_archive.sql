-- Phase 5: Two-stage archive system (Initial Review + Final Attorney-Reviewed)

ALTER TABLE lead_archives
  ADD COLUMN IF NOT EXISTS archive_stage TEXT NOT NULL DEFAULT 'initial_review',
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS packet_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS attorney_review_status TEXT,
  ADD COLUMN IF NOT EXISTS signature_status TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_by UUID;

CREATE TABLE IF NOT EXISTS archive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  archive_id UUID NOT NULL REFERENCES lead_archives(id) ON DELETE CASCADE,
  packet_id UUID REFERENCES lead_program_packets(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_category TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  uploaded_by TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked BOOLEAN NOT NULL DEFAULT false,
  superseded_by UUID,
  notes TEXT,
  audit_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archive_files_archive ON archive_files(archive_id);
CREATE INDEX IF NOT EXISTS idx_archive_files_lead ON archive_files(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_archives_stage ON lead_archives(archive_stage);

ALTER TABLE packet_print_logs
  ADD COLUMN IF NOT EXISTS archive_id UUID REFERENCES lead_archives(id) ON DELETE SET NULL;

ALTER TABLE archive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation archive_files"
  ON archive_files FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
