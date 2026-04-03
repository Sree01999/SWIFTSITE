# SwiftSite Test Cases (Unit + Integration)

This checklist is used before opening a PR.

## Unit test cases

### Capabilities
- `UT-CAP-001`: Load capabilities config successfully.
- `UT-CAP-002`: Return known capability and `null` for unknown IDs.
- `UT-CAP-003`: Enablement logic returns `true` for `working` and `partial`.
- `UT-CAP-004`: Status label mapping returns expected human label.
- `UT-CAP-005`: Status class mapping returns expected visual class family.
- `UT-CAP-006`: Summary metrics stay in valid bounds (`mvpReady <= mvpTotal`, progress `0..100`).

### Billing
- `UT-BILL-001`: Amount mapping for `build_fee` and `maintenance`.
- `UT-BILL-002`: Label mapping for `build_fee` and `maintenance`.
- `UT-BILL-003`: Billing env defaults to localhost app URL with Stripe disabled.
- `UT-BILL-004`: Billing env trims values and enables Stripe when key exists.

### Domains
- `UT-DOM-001`: CNAME target constant remains expected value.
- `UT-DOM-002`: Verification token format is 16 hex chars.
- `UT-DOM-003`: TXT verification value is generated correctly.

### Security
- `UT-SEC-001`: Rate limiter allows requests up to threshold.
- `UT-SEC-002`: Rate limiter returns `limited=true` after threshold.
- `UT-SEC-003`: Rate limiting is isolated by client IP.

## Integration test cases

### Deploy mock API
- `IT-DEPLOY-MOCK-001`: `GET /api/deploy/mock` returns health payload.
- `IT-DEPLOY-MOCK-002`: `POST /api/deploy/mock` returns generated deployment id and preview URL.

### API validation
- `IT-API-VAL-001`: `POST /api/auth/login` rejects invalid payload with `400`.
- `IT-API-VAL-002`: `POST /api/auth/register` rejects invalid payload with `400`.
- `IT-API-VAL-003`: `POST /api/deploy` rejects invalid payload with `400`.
- `IT-API-VAL-004`: `POST /api/domains` rejects invalid payload with `400`.
- `IT-API-VAL-005`: `POST /api/billing/checkout` rejects invalid payload with `400`.

### Dev endpoint guard
- `IT-DEV-GUARD-001`: `GET /api/deploy/mock` returns `404` when production guard is active.
- `IT-DEV-GUARD-002`: `POST /api/billing/invoices/[id]/pay` returns `404` when production guard is active.

## Commands to run

```bash
pnpm test:unit
pnpm test:integration
pnpm qa:gate
pnpm qa:heavy
pnpm run lint
pnpm run build
```

## Authenticated heavy QA prerequisites

- Add a stable confirmed QA account in Supabase Auth.
- Set `QA_TEST_EMAIL` and `QA_TEST_PASSWORD` in `.env.local`.
- Start app locally, then run `pnpm qa:heavy`.
- Optional signup-rate-limit checks can be enabled with:
  - `powershell -ExecutionPolicy Bypass -File scripts/qa-heavy-runtime.ps1 -BaseUrl http://localhost:3000 -IncludeSignupChecks`
