-- Government-record-only lead engine

CREATE TABLE source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  jurisdiction_state TEXT,
  jurisdiction_county TEXT,
  base_url TEXT NOT NULL,
  is_government_source BOOLEAN NOT NULL DEFAULT true,
  trust_level TEXT NOT NULL DEFAULT 'official'
    CHECK (trust_level IN ('official', 'official_secondary', 'enrichment', 'rejected')),
  allowed_for_lead_creation BOOLEAN NOT NULL DEFAULT false,
  requires_manual_login BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_source_registry_jurisdiction ON source_registry(jurisdiction_state, jurisdiction_county);
CREATE INDEX idx_source_registry_allowed ON source_registry(allowed_for_lead_creation) WHERE allowed_for_lead_creation = true;

CREATE TABLE rejected_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  search_id TEXT,
  source_name TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT,
  rejection_reason TEXT NOT NULL,
  hostname TEXT,
  raw_title TEXT,
  raw_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rejected_sources_org ON rejected_sources(organization_id);
CREATE INDEX idx_rejected_sources_search ON rejected_sources(search_id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS government_verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS government_sources_only BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE evidence_sources
  ADD COLUMN IF NOT EXISTS matched_fields JSONB DEFAULT '{}';

ALTER TABLE contact_candidates
  ADD COLUMN IF NOT EXISTS person_role TEXT;

ALTER TABLE property_media DROP CONSTRAINT IF EXISTS property_media_media_type_check;
ALTER TABLE property_media ADD CONSTRAINT property_media_media_type_check
  CHECK (media_type IN (
    'county_gis_photo', 'parcel_map', 'assessor_photo', 'county_photo',
    'street_view', 'static_map', 'source_screenshot'
  ));

ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE rejected_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Source registry readable by org users"
  ON source_registry FOR SELECT
  USING (true);

CREATE POLICY "Org isolation rejected_sources"
  ON rejected_sources FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

-- Maryland / Harford official sources
INSERT INTO source_registry (
  source_name, source_type, jurisdiction_state, jurisdiction_county, base_url,
  is_government_source, trust_level, allowed_for_lead_creation, requires_manual_login, notes
) VALUES
  ('Maryland SDAT Real Property Search', 'property_assessment', 'MD', NULL, 'https://sdat.dat.maryland.gov/', true, 'official', true, false, 'State Department of Assessments and Taxation real property search'),
  ('Maryland Land Records (MDLandRec)', 'deed_land_record', 'MD', NULL, 'https://mdlandrec.net/', true, 'official', true, true, 'Official Maryland land records — may require manual login'),
  ('Maryland Register of Wills Estate Search', 'probate_estate', 'MD', NULL, 'https://registers.maryland.gov/', true, 'official', true, false, 'Official estate and probate case search'),
  ('Harford County GIS Parcel Map', 'gis_parcel_map', 'MD', 'Harford', 'https://gis.harfordcountymd.gov/', true, 'official', true, false, 'Official Harford County parcel GIS'),
  ('Harford County Treasury / Property Tax', 'tax_record', 'MD', 'Harford', 'https://www.harfordcountymd.gov/', true, 'official_secondary', true, false, 'Harford County official property tax records'),
  ('Maryland Open Data Portal', 'open_data', 'MD', NULL, 'https://data.maryland.gov/', true, 'official_secondary', true, false, 'Official Maryland open-data property datasets'),
  ('Zillow', 'marketplace_listing', NULL, NULL, 'https://www.zillow.com/', false, 'rejected', false, false, 'Real estate marketplace — not valid for lead creation'),
  ('Realtor.com', 'marketplace_listing', NULL, NULL, 'https://www.realtor.com/', false, 'rejected', false, false, 'Real estate marketplace — not valid for lead creation'),
  ('Redfin', 'marketplace_listing', NULL, NULL, 'https://www.redfin.com/', false, 'rejected', false, false, 'Real estate marketplace — not valid for lead creation');
