# Engineering workflow

Veni follows the approved stack: **React (Vite) + Django REST Framework + Neon PostgreSQL + private S3 + EC2**.

## Documentation

- Domain language: [`CONTEXT.md`](../CONTEXT.md) (Matt Pocock **domain-modeling**)
- Architecture decisions: [`docs/adr/`](adr/)
- UI rules: [`design-system/veni/MASTER.md`](../design-system/veni/MASTER.md) and [`design-system/veni/pages/`](../design-system/veni/pages/)

## Recommended skill flow (Matt Pocock)

| Stage | Skill | Use |
|-------|--------|-----|
| Terminology / ADRs | domain-modeling | Keep `CONTEXT.md` and ADRs current |
| Module shape | codebase-design | Deep services in Django apps; thin DRF views |
| Spec | to-spec | After major feature discussions |
| Work breakdown | to-tickets | Tracer bullets with blocking edges |
| Implementation | implement + tdd | Test checkout, cart, payment services at seams |
| Review | code-review | Before merge |
| Incidents | diagnosing-bugs | Tight repro loop first |

TypeScript-only skills (e.g. setup-ts-deep-modules, migrate-to-shoehorn) apply to the **frontend** only when relevant, not to Django.

## Phase discipline

- **Phase 1 (complete):** docs, design system, scaffolding only — no business APIs or models.
- **Phase 2+:** See [`docs/roadmap.md`](roadmap.md).

## Code quality (planned)

- Backend: Ruff/format + pytest (introduced Phase 2)
- Frontend: existing Vite `lint` / `build`; optional Husky via **setup-pre-commit** when scripts stabilize
