# Pre-Live Cutover Checklist

This file tracks mock/test functionality that must be removed or switched before production launch.

## Mock Features To Remove Before Go-Live

- Billing mock payment action:
  - UI button: `Mark Paid (Dev)` in `/dashboard/billing`
  - API: `POST /api/billing/invoices/[id]/pay`
  - Action for go-live: hide/remove dev action and rely only on Stripe checkout + webhook.
- Mock checkout fallback:
  - Message: `Stripe is not configured yet. Invoice created in mock mode...`
  - Action for go-live: require Stripe keys in production and block mock fallback.
- Deploy mock endpoint:
  - API: `POST /api/deploy/mock`
  - Action for go-live: disable endpoint in production or protect behind admin-only dev flag.
- Domain manual failure simulation:
  - Domain `Fail` and `Reset` controls are useful for testing.
  - Action for go-live: keep only if explicitly allowed for operator workflow; otherwise remove/reset to strict verification flow.

## Deferred Until Business Registration Is Complete

- Stripe live onboarding and compliance:
  - Add live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  - Configure tax, statement descriptor, and webhook endpoint in live mode.
- Legal/commercial details:
  - Business support email and customer-facing support policy.
  - Billing terms, refund terms, and subscription cancellation policy.
- Production domain and DNS:
  - Replace test domains with purchased production domain(s).
  - Complete DNS + SSL verification for real domains.

## Recommended Launch Gates

- `pnpm scope:check` passes.
- `pnpm run lint` passes.
- `pnpm run build` passes.
- All capabilities with `scope: "mvp"` are `working` or explicitly accepted as `partial`.
