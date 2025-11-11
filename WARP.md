# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install deps: `pnpm install` (or `npm ci`)
- Env setup: `cp .env.example .env.local` then edit `.env.local`
- Dev server: `pnpm dev`
- Start background workers: `pnpm workers` (runs `scripts/start-workers.ts`)
- Lint / fix: `pnpm lint` • `pnpm lint:fix`
- Type-check: `pnpm type-check`
- Format / check: `pnpm format` • `pnpm format:check`
- Build: `pnpm build` • Start (prod): `pnpm start`
- Makefile shortcuts (optional): `make dev`, `make check`, `make test`, `make docker-build`

### Tests
- All checks (lint + type-check + unit): `pnpm check`
- Unit tests (Jest): `pnpm test`
  - Watch: `pnpm test:watch`
  - Coverage: `pnpm test:coverage`
  - Single file: `pnpm test -- __tests__/path/to/test.spec.ts`
  - By name: `pnpm test -- -t "regex or test name"`
- E2E (Playwright): `pnpm test:e2e`
  - Specific file: `pnpm test:e2e -- e2e/<file>.spec.ts`
  - Specific test: `pnpm test:e2e -- -g "regex or test name"`
  - UI mode: `pnpm test:e2e:ui`
  - Note: Playwright auto-starts the dev server (see `playwright.config.ts`).

### Docker
- Build: `pnpm run docker:build` (or `docker build -t nexa .`)
- Run: `pnpm run docker:run` (or `docker run -p 3000:3000 --env-file .env.local nexa`)
- Compose: `docker compose up -d` • Down: `docker compose down`

## High-level architecture

Nexa is a Next.js (App Router) TypeScript app with API route handlers and a background worker/agent layer. Core systems:

- Web app (Next.js): `app/` renders the UI and hosts API route handlers under `app/api/**/route.ts`.
- Services and agents: `src/services/*` encapsulate business logic; background jobs/agents are launched via `scripts/start-workers.ts` (BullMQ/Redis backed).
- Data and auth: Supabase (PostgreSQL, Auth, storage).
- AI and integrations: OpenAI for generation/analysis; Composio for X (Twitter) and Reddit; payments via Flutterwave.
- Testing: Jest for unit/integration; Playwright for end-to-end.
- Tooling/config: TypeScript (`tsconfig.json`), ESLint/Prettier, Tailwind CSS, Next config, Jest/Playwright configs, Dockerfile and `docker-compose.yml` for local Postgres/Redis.

## Pointers to repo docs (read first)
- README.md: Quick start and required environment variables.
- QUICKSTART.md: Short path to running key features locally.
- TESTING_GUIDE.md: Detailed testing steps and example API calls.
- DEVELOPER_GUIDE.md: Service/agent architecture and API surfaces.
- NEXA_STRUCTURE.md: App and route structure overview.
- DATABASE_SETUP_GUIDE.md: Supabase schema and migrations.
