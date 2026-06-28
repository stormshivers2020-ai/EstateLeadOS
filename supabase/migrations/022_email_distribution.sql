-- Phase 6: Final buyer/realtor distribution + controlled email send

ALTER TABLE distribution_packets
  ADD COLUMN IF NOT EXISTS final_archive_id UUID REFERENCES lead_archives(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hide_internal_profit_notes BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE email_distributions
  ADD COLUMN IF NOT EXISTS follow_up_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distribution_record_archived BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Org isolation attorney_reviews"
  ON attorney_reviews FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation attorney_review_uploads"
  ON attorney_review_uploads FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation attorney_compensation"
  ON attorney_compensation FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation distribution_packets"
  ON distribution_packets FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation email_distributions"
  ON email_distributions FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation external_recipients"
  ON external_recipients FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation distribution_audit_logs"
  ON distribution_audit_logs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
