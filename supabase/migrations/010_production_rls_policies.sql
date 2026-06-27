-- Production RLS policies for tables enabled in migrations 005–007

-- Helper: org membership check
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() AND organization_id IS NOT NULL;
$$;

-- ─── Phase 5: Documents ─────────────────────────────────────────────────────

CREATE POLICY "Org isolation document_records"
  ON document_records FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation document_templates"
  ON document_templates FOR ALL
  USING (organization_id IS NULL OR organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation lead_document_packets"
  ON lead_document_packets FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation uploaded_documents"
  ON uploaded_documents FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation attorney_review_items"
  ON attorney_review_items FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation document_audit_logs"
  ON document_audit_logs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation document_workflow_blockers"
  ON document_workflow_blockers FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

-- ─── Phase 6: Deal workflow ─────────────────────────────────────────────────

CREATE POLICY "Org isolation deal_calculations"
  ON deal_calculations FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation buyers"
  ON buyers FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation assignments"
  ON assignments FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation buyer_matches"
  ON buyer_matches FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

-- ─── Phase 3: Compliance check results ──────────────────────────────────────

CREATE POLICY "Org isolation compliance_check_results"
  ON compliance_check_results FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org isolation compliance_audit_logs"
  ON compliance_audit_logs FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

-- ─── Phase 7: Platform (org-scoped rows only) ───────────────────────────────

CREATE POLICY "Org members view own billing"
  ON billing_accounts FOR SELECT
  USING (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org members view own usage"
  ON usage_records FOR SELECT
  USING (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org members view own support tickets"
  ON support_tickets FOR ALL
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Org members view own audit logs"
  ON platform_audit_logs FOR SELECT
  USING (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "Super admin platform orgs"
  ON platform_organizations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

CREATE POLICY "Super admin platform users"
  ON platform_users FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

CREATE POLICY "Super admin market licenses"
  ON market_licenses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'scs_nova_super_admin'));

-- ─── Onboarding / profile extensions ────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disclaimer_acknowledged_at TIMESTAMPTZ;

-- Fix org update policy from migration 008 (invalid role name)
DROP POLICY IF EXISTS "Org admins can update organization" ON organizations;
CREATE POLICY "Org admins can update organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('org_admin', 'scs_nova_super_admin')
    )
  );
