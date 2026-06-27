-- EstateLeadOS County Pipeline Expansion Engine

CREATE TABLE county_pipeline_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state_abbr TEXT NOT NULL,
  county_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  automation_mode TEXT NOT NULL DEFAULT 'supervised',
  is_paused BOOLEAN NOT NULL DEFAULT false,
  is_proof_engine BOOLEAN NOT NULL DEFAULT false,
  active_source_ids UUID[] DEFAULT '{}',
  signals_found INTEGER NOT NULL DEFAULT 0,
  estate_matches INTEGER NOT NULL DEFAULT 0,
  property_matches INTEGER NOT NULL DEFAULT 0,
  ready_for_review INTEGER NOT NULL DEFAULT 0,
  verified_leads INTEGER NOT NULL DEFAULT 0,
  rejected_leads INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_run_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, state_abbr, county_name)
);

CREATE INDEX idx_county_pipeline_configs_state ON county_pipeline_configs(state_abbr);

CREATE TABLE lead_pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  county_config_id UUID REFERENCES county_pipeline_configs(id) ON DELETE SET NULL,
  state_abbr TEXT NOT NULL,
  county_name TEXT NOT NULL,
  pipeline_stage TEXT NOT NULL DEFAULT 'new_government_signal',
  property_address TEXT,
  decedent_name TEXT,
  personal_representative TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  government_sources_only BOOLEAN NOT NULL DEFAULT true,
  manual_approval_required BOOLEAN NOT NULL DEFAULT true,
  manually_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_pipeline_items_stage ON lead_pipeline_items(pipeline_stage);
CREATE INDEX idx_lead_pipeline_items_county ON lead_pipeline_items(state_abbr, county_name);

CREATE TABLE lead_pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_item_id UUID REFERENCES lead_pipeline_items(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  county_config_id UUID REFERENCES county_pipeline_configs(id) ON DELETE SET NULL,
  automation_run_id UUID,
  actor_user_id TEXT,
  actor_user_name TEXT,
  event_type TEXT NOT NULL,
  prior_stage TEXT,
  new_stage TEXT,
  source_name TEXT,
  source_url TEXT,
  confidence_score INTEGER,
  reason TEXT,
  evidence_id UUID REFERENCES evidence_sources(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_pipeline_events_item ON lead_pipeline_events(pipeline_item_id);
CREATE INDEX idx_lead_pipeline_events_run ON lead_pipeline_events(automation_run_id);

CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  county_config_id UUID REFERENCES county_pipeline_configs(id) ON DELETE SET NULL,
  state_abbr TEXT NOT NULL,
  county_name TEXT NOT NULL,
  run_type TEXT NOT NULL DEFAULT 'county_pipeline',
  status TEXT NOT NULL DEFAULT 'running',
  automation_mode TEXT NOT NULL DEFAULT 'supervised',
  sources_queried INTEGER NOT NULL DEFAULT 0,
  signals_found INTEGER NOT NULL DEFAULT 0,
  items_created INTEGER NOT NULL DEFAULT 0,
  items_rejected INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_county ON automation_runs(state_abbr, county_name);

ALTER TABLE county_pipeline_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation county_pipeline_configs"
  ON county_pipeline_configs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation lead_pipeline_items"
  ON lead_pipeline_items FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation lead_pipeline_events"
  ON lead_pipeline_events FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation automation_runs"
  ON automation_runs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
