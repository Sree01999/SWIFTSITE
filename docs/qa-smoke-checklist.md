# QA Smoke Checklist (Light)

Date: 2026-03-23

This is a lightweight pre-release sanity check (not a full regression pass).

## Automated Checks

- `pnpm scope:check` -> PASS
- `pnpm run lint` -> PASS
- `pnpm run build` -> PASS

## Quick Manual Flows To Verify In Browser

- Auth:
  - Login and logout flow works.
- Clients:
  - Create client and confirm row appears.
- Projects:
  - Create project and open project detail page.
- Deployments:
  - Trigger deploy and verify status updates in project detail.
- Domains:
  - Add domain, run DNS check, and validate status transitions.
- Monitoring:
  - Export CSV works.
  - Detailed analytics page loads and filter form works.
- Billing (mock mode):
  - Start checkout creates invoice.
  - Mark Paid (Dev) updates invoice and KPI totals.
- Dashboard CTAs:
  - Explore API opens `/dashboard/api`.
  - View Samples opens `/dashboard/samples`.

## Notes

- Stripe live and production domain cutover are intentionally deferred.
- See `docs/pre-live-cutover-checklist.md` for mock removal before go-live.
