-- Unified lead packets: real-data packet builder output per lead

CREATE TABLE IF NOT EXISTS lead_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  packet_status TEXT NOT NULL DEFAULT 'draft',
  packet_version INTEGER NOT NULL DEFAULT 1,
  packet_json JSONB NOT NULL,
  missing_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_count INTEGER NOT NULL DEFAULT 0,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  contact_count INTEGER NOT NULL DEFAULT 0,
  confidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by TEXT NOT NULL DEFAULT 'system',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_packets_lead ON lead_packets(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_packets_status ON lead_packets(packet_status);
CREATE INDEX IF NOT EXISTS idx_lead_packets_generated ON lead_packets(generated_at DESC);

ALTER TABLE lead_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_packets_org_access ON lead_packets
  FOR ALL
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
