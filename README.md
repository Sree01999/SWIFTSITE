## SwiftSite Platform (MVP)

This repository contains the SwiftSite internal operator dashboard for the MVP.
Current implementation focus:

- Single-operator architecture
- Supabase Auth + RLS data isolation by `owner_id`
- Dashboard foundation (Clients, Projects, Billing, Settings)
- Stripe and payment flows intentionally deferred to final implementation stage

## Stack
- Next.js (App Router, TypeScript)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Tailwind CSS
- Zod

## Local Setup
1. Install dependencies:
```bash
pnpm install
```

2. Copy env template:
```bash
copy .env.example .env.local
```

3. Fill in at least:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Apply database migration in Supabase SQL editor:
- `supabase/migrations/001_init.sql`

5. Run dev server:
```bash
pnpm dev
```

6. Open `http://localhost:3000`

## Current Routes
- `/` landing + auth entry
- `/auth/login`
- `/auth/register`
- `/dashboard` (protected)
- `/dashboard/capabilities` (live capability ledger)
- `/dashboard/clients` (list + create client)
- `/dashboard/projects` (placeholder)
- `/dashboard/billing` (placeholder)
- `/dashboard/settings` (placeholder)

## Notes

- This project is now standardized on `pnpm` for dependency management.
- Payment integration (`Stripe checkout`, webhook, subscriptions) is deferred by request.
- Domain can remain temporary/test until professional domain cutover.
- Keep all production secrets in Vercel environment variables, never in git.
- Scope guard command: `pnpm scope:check`
- Capability ledger docs: `docs/capability-ledger.md`

## Next Work Slice
- Day 4: richer client detail views
- Day 5: project CRUD
- Day 6: Vercel deploy hooks
- Day 7: domain and SSL status tracking
