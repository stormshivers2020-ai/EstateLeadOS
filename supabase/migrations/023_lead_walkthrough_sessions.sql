-- First Lead Walkthrough sessions (deterministic guided flow)

CREATE TABLE IF NOT EXISTS lead_walkthrough_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  current_step TEXT NOT NULL DEFAULT 'start',
  completed_steps JSONB NOT NULL DEFAULT '[]',
  step_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  locked BOOLEAN NOT NULL DEFAULT true,
  final_outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_org ON lead_walkthrough_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_lead ON lead_walkthrough_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_status ON lead_walkthrough_sessions(status);

ALTER TABLE lead_walkthrough_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation lead_walkthrough_sessions"
  ON lead_walkthrough_sessions FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
