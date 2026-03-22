# SwiftSite MVP Execution Notes

## Decision Log (2026-03-22)
- Build in current local workspace: `C:\Users\bhupa\Desktop\SWIFTSITE`
- Start with one primary codebase now: `swiftsite-platform`
- Keep architecture scalable for future multi-operator support via `owner_id`
- Run as strict single-operator for MVP
- Use free-tier-first services and configuration
- Defer Stripe payment integration to final stage
- Billing model to implement later: `$199` one-time + `$19/month` recurring
- Use temporary domain setup for MVP, then switch to professional domain later

## Suggested Build Order
1. Foundation and auth (current)
2. Client and project CRUD
3. Deployment and domain automation
4. Notifications and reporting
5. Hardening and test onboarding flow
6. Stripe/payment integration as final stage before production go-live

## Payment Deferral Guardrails
- Keep `billing` pages and schema ready, but no live Stripe logic yet
- Keep Stripe env vars present in `.env.example` for easy activation
- Ensure future webhook handling uses idempotency via `processed_events`
