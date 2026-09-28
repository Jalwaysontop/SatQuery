# Contributing to SatQuery AI

Thanks for helping improve SatQuery. This guide covers how we work.

## Development setup

Follow the [Quick start](README.md#quick-start) in the root README, then:

```bash
make install      # backend venv deps + frontend npm ci
make test         # everything CI runs
```

## Branching

- `main` is always deployable and protected. Never push to it directly.
- Create short-lived branches from `main`:

  | Prefix | Use for |
  |---|---|
  | `feat/` | New features |
  | `fix/` | Bug fixes |
  | `docs/` | Documentation only |
  | `refactor/` | Code changes with no behaviour change |
  | `chore/` | Tooling, CI, dependencies |
  | `ml/` | Notebook / model experiments |

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(backend): add SAR-only change-VQA prompt
fix(frontend): keep uploaded files when switching tabs
docs: document GROUNDING_ADAPTER_DIR
```

Scopes: `backend`, `frontend`, `ml`, `models`, `ci`, `docs`.

## Pull requests

1. Keep PRs focused. One logical change per PR.
2. Fill in the PR template, including how you tested the change.
3. Make sure CI is green: backend `pytest`, frontend `lint` + `build`.
4. At least one approving review is required before merge.
5. Squash-merge, using a Conventional Commit title.

### Checklist before opening a PR

- [ ] `cd backend && pytest` passes
- [ ] `cd frontend && npm run lint && npm run build` passes
- [ ] New settings are added to `backend/app/config.py` **and** `backend/.env.example`
- [ ] Public API changes are reflected in `backend/app/schemas.py`, `frontend/src/utils/api.ts`, and the docs
- [ ] No secrets, `.env` files, datasets, or large weights are committed

## Code style

| Area | Tooling / convention |
|---|---|
| Python | PEP 8, max line length 120 (`backend/setup.cfg`), type hints on public functions |
| TypeScript | `oxlint` (`frontend/.oxlintrc.json`), strict TS config |
| Formatting | `.editorconfig` at the repo root |
| Config | Read settings only through `backend/app/config.py`. Never call `os.getenv` elsewhere. |

## Adding a new backend tool

1. Implement `backend/app/tools/base.Tool`.
2. Register it in `backend/app/agent/registry.py`.
3. Extend `backend/app/agent/classifier.py` routing if needed.
4. Add tests under `backend/tests/`.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#15-extension-points-summarized).

## Models, data, and notebooks

- Put weights in `models/`, never in `ml/` or `backend/`. See [`models/README.md`](models/README.md).
- Weights over a few MB must go through Git LFS or be shared out of band.
- Clear large notebook outputs before committing.

## Reporting bugs and requesting features

Use the GitHub issue templates. For security issues, follow [`SECURITY.md`](SECURITY.md) instead.
