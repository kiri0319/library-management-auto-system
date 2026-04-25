# Development Workflow

## Daily workflow

1. Pull latest `main`.
2. Create a focused branch.
3. Make a scoped change with clear commit message.
4. Validate manually (and automated checks when available).
5. Open PR with context and test notes.

## Commit guidance

- Keep one concern per commit.
- Prefer prefixes: `feat`, `fix`, `refactor`, `docs`, `chore`.
- Explain intent and impact in commit body.

## Review guidance

- Validate user-facing behavior.
- Confirm no secrets or generated artifacts were added.
- Ensure docs/config updates are included when needed.
