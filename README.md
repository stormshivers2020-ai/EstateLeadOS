# EstateLeadOS

**Powered by SCS Nova**

Nationwide inherited-property intelligence and acquisition workflow platform for real estate investors, wholesalers, acquisition teams, and real estate companies.

## Tech Stack

- Next.js / React / TypeScript
- Tailwind CSS
- Supabase-ready (auth, database, storage, RLS)
- Stripe-ready billing architecture
- Local-first data provider abstraction for preview without production credentials

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Alternative package managers:

```bash
pnpm install && pnpm dev
# or
bun install && bun dev
```

Open [http://localhost:3000](http://localhost:3000).

**To preview EstateLeadOS locally before Supabase, keep `NEXT_PUBLIC_DATA_PROVIDER=local`.**

## Environment Variables

| Variable | Local Preview | Supabase Mode |
|----------|---------------|---------------|
| `NEXT_PUBLIC_DATA_PROVIDER` | `local` | `supabase` |
| `NEXT_PUBLIC_APP_MODE` | `local` | `production` |
| `NEXT_PUBLIC_USE_SUPABASE` | `false` | `true` |
| `NEXT_PUBLIC_USE_LOCAL_AUTH` | `true` | `false` |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `true` | optional |
| `NEXT_PUBLIC_ENABLE_FRESH_START` | `true` | optional |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (demo) / `false` (fresh-start) | same |

Supabase and Stripe keys are **not required** in local preview mode.

## Local Preview Mode

When `NEXT_PUBLIC_DATA_PROVIDER=local`:

- No Supabase connection required
- No Stripe connection required
- No live public-record APIs called
- Simulated local auth with role-based permissions
- localStorage persistence for create/update/delete testing
- Visible **Local Preview Mode** badge in the app shell

### Local Role Login

On `/login`, use **Continue as Role** buttons:

- Solo Investor
- Acquisition Manager
- Team Member
- Compliance Reviewer
- Organization Admin
- SCS Nova Super Admin

Role permissions still apply locally. SCS Nova Super Admin can access the Admin Console; normal users cannot.

### Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` to load fictional sample data across all modules (Dashboard, Lead Feed, Compliance, Documents, CRM, Buyers, Assignments, Reports, Admin Console, etc.).

Banner: *Demo Mode is active. All records shown are fictional sample data.*

Reset via **Settings → Local Preview Controls → Reset Demo Data**.

### Fresh-Start Mode

Set `NEXT_PUBLIC_DEMO_MODE=false` for empty records with onboarding prompts.

Banner: *Fresh Start Mode is active. No demo records are loaded.*

Clear via **Settings → Local Preview Controls → Clear Local Data**.

### CSV Import Testing

Import CSV locally without Supabase. Use **Import Sample CSV** in Local Preview Controls or upload via the import flow. Sample CSV uses fictional data only.

### Local Dev Control Panel

**Settings → Local Preview Controls** (local mode only):

- Reset demo data / clear local data
- Switch role and organization
- Simulate billing status
- Simulate connector runs
- Import sample CSV

## Supabase Connection Path

Local data models mirror the planned Supabase schema. To connect production:

1. Configure Supabase project
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run migrations in `supabase/migrations/`
4. Configure RLS, auth, and storage buckets
5. Set `NEXT_PUBLIC_DATA_PROVIDER=supabase` and `NEXT_PUBLIC_USE_SUPABASE=true`
6. Test organization isolation, uploads, auth roles, and audit logs

Unimplemented Supabase methods return: *Supabase provider is not fully connected yet. Switch NEXT_PUBLIC_DATA_PROVIDER=local to continue previewing locally.*

## Stripe Connection Path

Billing is simulated in local preview. Connect Stripe before launch:

1. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`
2. Configure webhook with `STRIPE_WEBHOOK_SECRET`
3. Enable billing in Supabase mode

## Known Production Placeholders

- Live public-record connectors (simulated locally)
- Supabase Storage for documents (local metadata placeholder)
- Stripe payments (simulated billing status)
- Real organization isolation via RLS (local org simulation)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirected to login | Use a local role button on `/login` |
| Empty dashboard | Set `NEXT_PUBLIC_DEMO_MODE=true` or import CSV |
| Admin Console blocked | Login as SCS Nova Super Admin |
| Supabase errors on start | Ensure `NEXT_PUBLIC_DATA_PROVIDER=local` |
| Stale local data | Settings → Clear Local Data or Reset Demo Data |

## Build Phases

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Foundation, brand, SaaS shell | Active |
| 2 | Lead Discovery Engine | Active |
| 3 | State Deal Kits & Compliance | Active |
| 4 | Lead Detail, CRM, Outreach | Active |
| 5 | Document Center | Active |
| 6 | Deal Calculator, Buyers, Assignments | Active |
| 7 | Admin Console, Billing | Active |
| 8 | Final Integration & Launch | Active |

## Migration Readiness

Local data models are structured to mirror the planned Supabase schema. Supabase connection can be enabled by switching the data provider and configuring environment variables.

## Disclaimer

EstateLeadOS provides workflow tools, document templates, public-record research support, and compliance checklists. EstateLeadOS does not provide legal, tax, brokerage, financial, or investment advice.
