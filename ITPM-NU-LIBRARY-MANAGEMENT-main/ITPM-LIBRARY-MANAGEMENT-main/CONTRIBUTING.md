# Contributing Guide

Thanks for contributing to the Library Management System.

## Development Setup

1. Install dependencies from project root:
   - `npm install`
2. Configure environment files:
   - `cp server/.env.example server/.env`
   - `cp client/.env.example client/.env`
3. Seed local sample data:
   - `npm run seed`
4. Start full stack locally:
   - `npm run dev`

## Branch and Commit Conventions

- Create feature branches from `main`.
- Use concise commit prefixes like `feat`, `fix`, `docs`, `refactor`, and `chore`.
- Keep each commit focused on one logical change.

Example:

- `feat(seats): add student seat booking flow`
- `fix(auth): handle expired reset token`

## Pull Request Checklist

- Confirm local app starts for both client and server.
- Verify changed flows manually before opening PR.
- Update docs when endpoints, env keys, or scripts change.
- Keep PR descriptions short, with clear test notes.

## Code Style

- Prefer small reusable functions and components.
- Keep API routes/controllers grouped by domain.
- Avoid committing generated artifacts and local runtime files.
