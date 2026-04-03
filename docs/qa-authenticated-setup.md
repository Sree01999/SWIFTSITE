# Authenticated Heavy QA Setup

Use this once to unblock full authenticated QA coverage.

## 1) Create stable QA user

- Supabase Dashboard -> Authentication -> Users -> Add user
- Use a permanent account (example): `qa.operator@your-domain.com`
- Mark as confirmed/verified user

## 2) Configure local env

Add to `.env.local`:

```env
QA_TEST_EMAIL=qa.operator@your-domain.com
QA_TEST_PASSWORD=your-strong-password
```

## 3) Run release test gates

```bash
pnpm qa:gate
```

## 4) Run heavy runtime matrix

```bash
pnpm qa:heavy
```

Notes:
- Heavy QA skips authenticated matrix if QA credentials are missing.
- Signup-rate-limit checks are disabled by default to avoid flaky results.
- To include signup checks:
  - `powershell -ExecutionPolicy Bypass -File scripts/qa-heavy-runtime.ps1 -BaseUrl http://localhost:3000 -IncludeSignupChecks`
