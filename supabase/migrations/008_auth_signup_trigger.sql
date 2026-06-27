-- Auto-create organization + profile on Supabase Auth signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  user_name TEXT;
BEGIN
  org_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_name'), ''),
    split_part(NEW.email, '@', 1) || ' Organization'
  );
  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO organizations (name, owner_id, plan_id, billing_status)
  VALUES (org_name, NEW.id, 'starter', 'trial')
  RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, email, full_name, role, organization_id)
  VALUES (NEW.id, NEW.email, user_name, 'org_admin', new_org_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow org admins to update their organization
CREATE POLICY "Org admins can update organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('org_admin', 'scs_nova_admin', 'scs_nova_super_admin')
    )
  );
