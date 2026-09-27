# Agent instructions — Veni

Before implementing features:

1. Read [`CONTEXT.md`](CONTEXT.md) for domain terms.
2. Respect [`docs/adr/`](docs/adr/) — do not swap the stack (React + Django + Neon + S3 + EC2).
3. For UI, read [`design-system/veni/MASTER.md`](design-system/veni/MASTER.md) and the relevant [`design-system/veni/pages/`](design-system/veni/pages/) override.
4. Follow [`docs/engineering-workflow.md`](docs/engineering-workflow.md) and test at Django **service** seams per [`docs/testing-strategy.md`](docs/testing-strategy.md).

Phase 1 complete: no business models or `/api/v1` routes until Phase 2+ approval.

## Agent skills

### Issue tracker

GitHub Issues on [`shahan-giki/veni_cur`](https://github.com/shahan-giki/veni_cur), via the `gh` CLI. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

The five canonical roles, each label string equal to its name. See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single-context: root `CONTEXT.md` plus `docs/adr/`. See [`docs/agents/domain.md`](docs/agents/domain.md).
