# Migration Readiness

Local data models are structured to mirror the planned Supabase schema. Supabase connection can be enabled by switching the data provider and configuring environment variables.

## Switch to Supabase

1. Configure Supabase project
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run migrations in `supabase/migrations/`
4. Configure RLS, auth, and storage buckets
5. Set `NEXT_PUBLIC_DATA_PROVIDER=supabase` and `NEXT_PUBLIC_USE_SUPABASE=true`
6. Test organization isolation, file uploads, auth roles, and audit logs
