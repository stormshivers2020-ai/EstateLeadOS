-- EstateLeadOS Verification & Citation System
-- Evidence chain, contact candidates, property media, manual approval audit

-- Raw search / worker hits (one row per internet or connector result)
CREATE TABLE record_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  search_id TEXT,
  source_name TEXT,
  source_type TEXT NOT NULL DEFAULT 'internet_search',
  source_url TEXT,
  source_title TEXT,
  raw_snippet TEXT,
  matched_fields JSONB DEFAULT '{}',
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_record_hits_lead ON record_hits(lead_id);
CREATE INDEX idx_record_hits_org ON record_hits(organization_id);

CREATE TABLE evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  record_hit_id UUID REFERENCES record_hits(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  source_title TEXT,
  citation_label TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  screenshot_url TEXT,
  source_excerpt TEXT,
  source_hash TEXT,
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_sources_lead ON evidence_sources(lead_id);

CREATE TABLE person_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  role_label TEXT NOT NULL DEFAULT 'needs_verification',
  connection_rationale TEXT,
  confidence_score INTEGER DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'needs_verification',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_person_verifications_lead ON person_verifications(lead_id);

CREATE TABLE contact_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  person_verification_id UUID REFERENCES person_verifications(id) ON DELETE SET NULL,
  person_name TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email', 'mailing_address')),
  contact_value TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  confidence_score INTEGER DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_candidates_lead ON contact_candidates(lead_id);

CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('county_photo', 'street_view', 'static_map', 'source_screenshot')),
  media_url TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  attribution TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_media_lead ON property_media(lead_id);

CREATE TABLE verification_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_user_id TEXT,
  actor_user_name TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  source_evidence_id UUID REFERENCES evidence_sources(id) ON DELETE SET NULL,
  contact_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_action_logs_lead ON verification_action_logs(lead_id);

ALTER TABLE record_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation record_hits"
  ON record_hits FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation evidence_sources"
  ON evidence_sources FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation person_verifications"
  ON person_verifications FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation contact_candidates"
  ON contact_candidates FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation property_media"
  ON property_media FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation verification_action_logs"
  ON verification_action_logs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
