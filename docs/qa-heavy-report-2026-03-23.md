# Heavy QA Report

Date: 2026-03-23  
Environment: local (`http://localhost:3010`)

## Scope

- Build-quality gates
- API contract checks (public and protected endpoints)
- Auth flow behavior and access controls
- Runtime response stability (JSON vs HTML errors)

## Artifacts

- Runtime script: `scripts/qa-heavy-runtime.ps1`
- Runtime raw results: `docs/qa-heavy-runtime-results.json`

## Gate Results

- `pnpm scope:check` -> PASS
- `pnpm run lint` -> PASS
- `pnpm run build` -> PASS

## Runtime Matrix Summary

- Total checks: 36
- Passed (executed): 18
- Failed: 0
- Blocked/Skipped: 18

Executed checks validated:

- Public pages are reachable (`/`, `/auth/login`, `/auth/register`)
- Unauthenticated dashboard access redirects correctly
- Protected APIs correctly reject unauthorized requests
- Validation errors return expected `400` responses
- Mock deploy endpoint (`/api/deploy/mock`) works
- Stripe webhook endpoint fails safely when secret is missing (`503`)

## Findings

1. **[P2] Authenticated QA coverage is blocked by auth-provider constraints**
   - Evidence: `Admin create confirmed QA user` skipped with `401 Unauthorized` from Supabase admin endpoint; authenticated route/API checks were skipped.
   - Impact: Full logged-in heavy QA automation cannot execute end-to-end in current local auth configuration.
   - Likely cause: available key in local env is not permitted for Supabase admin-user creation in this project setup.

2. **[P3] Registration endpoint is rate-limited during repeated QA runs**
   - Evidence: `Register valid user` returned `email rate limit exceeded` on repeated test cycles.
   - Impact: Repeated automated signup tests are throttled and may produce noisy false alarms.
   - Note: this is expected behavior from provider-side anti-abuse controls.

## Risk Assessment

- **Core quality risk:** LOW for unauthenticated/API-validation surface.
- **Coverage risk:** MEDIUM because authenticated heavy automation is partially blocked.

## Recommended Next Actions

1. Create one dedicated confirmed QA operator account manually and store credentials in a private local QA config.
2. Re-run authenticated matrix against that account to unskip the 18 blocked checks.
3. Keep `scripts/qa-heavy-runtime.ps1` as the repeatable heavy QA baseline for each pre-release cycle.
