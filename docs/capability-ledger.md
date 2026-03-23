# Capability Ledger

SwiftSite now uses a code-enforced capability ledger to prevent scope creep.

## Source of truth

- Ledger file: `src/config/capabilities.json`
- Runtime helpers: `src/lib/capabilities.ts`
- Live dashboard view: `/dashboard/capabilities`

Each capability maps:

- Requirement ID from the business/MVP plan
- UI routes and interactive controls
- Backend/API/data mapping
- Scope (`mvp` or `post_mvp`)
- Delivery status (`working`, `partial`, `stub`, `out_of_scope`)

## UI mapping rule

Every interactive control that belongs to a tracked capability must include:

```tsx
data-capability="capability-id"
```

## Guardrail check

Run:

```bash
pnpm scope:check
```

This fails when:

- A UI control references an unknown capability ID
- A `uiRequired: true` capability has no mapped UI control
- Ledger shape/status/scope values are invalid

## CI enforcement

GitHub Actions workflow: `.github/workflows/capability-guard.yml`

Every push/PR to `main` runs the scope guard.
