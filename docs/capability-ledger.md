# Capability Ledger

SwiftSite now uses a code-enforced capability ledger to prevent scope creep.

## Source of truth

- Ledger file: `src/config/capabilities.json`
- Release scope lock: `src/config/release-scope.json`
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
- A capability is not mapped in release scope lock (`inScope` or `deferred`)
- Release scope lock references unknown or duplicate capability IDs
- An in-scope capability is marked `out_of_scope`

## Scope lock workflow

When starting a new release:

1. Update `release` in `src/config/release-scope.json`
2. Move capability IDs between `inScope` and `deferred`
3. Run `pnpm scope:check`
4. Confirm `/dashboard/capabilities` shows the expected in-scope/deferred split

## CI enforcement

GitHub Actions workflow: `.github/workflows/capability-guard.yml`

Every push/PR to `main` runs the scope guard.
