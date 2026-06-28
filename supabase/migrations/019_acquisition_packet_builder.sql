-- Phase 3: Acquisition Packet Builder + Signature-Ready Draft Documents

ALTER TABLE lead_program_packets
  ADD COLUMN IF NOT EXISTS attorney_review_status TEXT NOT NULL DEFAULT 'not_started';

CREATE TABLE IF NOT EXISTS draft_signature_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_id UUID REFERENCES lead_program_packets(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  template_version TEXT NOT NULL DEFAULT '1.0',
  required_fields TEXT[] DEFAULT '{}',
  missing_fields TEXT[] DEFAULT '{}',
  generated_html TEXT,
  pdf_url TEXT,
  attorney_review_required BOOLEAN NOT NULL DEFAULT true,
  signature_required BOOLEAN NOT NULL DEFAULT false,
  signed_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_draft_signature_documents_lead ON draft_signature_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_draft_signature_documents_packet ON draft_signature_documents(packet_id);

ALTER TABLE draft_signature_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation draft_signature_documents"
  ON draft_signature_documents FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
