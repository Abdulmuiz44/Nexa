# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install deps: `pnpm install` (or `npm ci`)
- Env setup: `cp .env.example .env.local` then edit `.env.local`
- Dev server: `pnpm dev`
- Start workers: `pnpm workers` (runs `scripts/start-workers.ts`)
- Lint: `pnpm lint` • Fix: `pnpm lint:fix`
- Type-check: `pnpm type-check`
- Format: `pnpm format` • Check: `pnpm format:check`
- Build: `pnpm build`
- Start (prod): `pnpm start`

### Tests
- All checks: `pnpm check` (lint + type-check + unit tests)
- Unit tests: `pnpm test`
  - Watch: `pnpm test:watch`
  - Coverage: `pnpm test:coverage`
  - Run a single file: `pnpm test -- __tests__/agent/runner.test.ts`
  - Run by name: `pnpm test -- -t "should execute skill"`
- E2E (Playwright): `pnpm test:e2e`
  - Specific file: `pnpm test:e2e -- e2e/login.spec.ts`
  - Specific test: `pnpm test:e2e -- -g "logs in successfully"`
  - UI mode: `pnpm test:e2e:ui`
  - Note: Playwright auto-starts the dev server (`npm run dev`) at http://localhost:3000 per `playwright.config.ts`.

### Database and scripts
- One-time DB setup (Neon/Postgres via SQL): `pnpm dlx tsx scripts/run-db-setup.ts`
- Migrations example: `pnpm dlx tsx scripts/run-migrations.ts`
- Prisma helpers (if applicable):
  - Generate: `npx prisma generate`
  - Dev migrate: `npx prisma migrate dev`
  - Studio: `npx prisma studio`
- Supabase: see README for using Supabase CLI (schema managed there) and required env vars.

### Docker
- Build: `pnpm run docker:build` (or `docker build -t nexa .`)
- Run: `pnpm run docker:run` (binds 3000) or `docker run -p 3000:3000 --env-file .env.local nexa`
- Compose: `docker compose up -d` • Down: `docker compose down`

## High-level architecture

Nexa is a Next.js 15 (App Router) app with server route handlers and a TypeScript service/agent layer. Data and auth are primarily via Supabase; external integrations via Composio and third-party SDKs.

- UI (App Router): `app/`
  - Pages and dashboards (e.g., `app/dashboard/*`), auth flows (`app/auth/*`), and docs.
  - API route handlers under `app/api/**/route.ts` implement server endpoints for auth (NextAuth), campaigns, content generation, analytics, logs, payments (Flutterwave webhook), onboarding, connectors (Composio), MCP endpoints, and health checks.
  - Global layout, theming, and styles (`app/layout.tsx`, `app/globals.css`, `theme.config.ts`).

- Shared clients and utilities (Next.js side): `lib/`
  - Clients: `openaiClient.ts`, `supabaseClient.ts`, `composioClient.ts`, `flutterwaveClient.ts`, `logger.ts`.
  - Agent presets: `lib/agents/*` (e.g., `growthAgent.ts`, `analyticsAgent.ts`).

- Core domain (server/worker layer): `src/`
  - Agent runtime: `src/agent/`
    - Runner and CLI (`runner.ts`, `agentchatCLI.ts`), LLM wrapper (`llm/wrapper.ts`).
    - Skills registry and implementations (`skills/*`: content generation, social posting, market research, email outreach).
    - State and persistence adapters (`store/*`: memory, Neon, Supabase) and queues (`queue/*`).
    - Cross-cutting logging (`utils/logger.ts`).
  - Services: `src/services/` (content generation orchestration, analytics engine, Nexa agent service).
  - Integrations: `src/connectors/*` (Twitter, Reddit, email) and `src/vector/pinecone.ts`.
  - Infrastructure/middleware: `src/middleware/*` (auth, onboarding enforcement, rate limiting, subscription checks); monitoring under `src/monitoring/*`.
  - Payments: `src/payments/flutterwave.ts`.
  - Workers: `src/workers/postScheduler.ts` (BullMQ-based schedulers/analytics workers), started via `scripts/start-workers.ts`.

- Middleware at the edge: top-level `middleware.ts` for route protection and session handling.

- Testing:
  - Unit/integration: Jest configured via `jest.config.js`; tests in `__tests__/` covering agents, API, and skills.
  - E2E: Playwright in `e2e/` with multi-browser projects; dev server autostart per config.

- Configuration: `next.config.mjs`, `tsconfig.json`, Tailwind (`tailwind.config.ts`, `styles/globals.css`), ESLint/Prettier configs.

## Notes from README
- Prereqs: Node 18+, pnpm; required env vars for OpenAI, Supabase (URL/keys/service role), NextAuth, Composio, and Flutterwave. See README “Environment Variables”.
- Typical dev loop: `pnpm dev` (app) + `pnpm workers` (background jobs); open http://localhost:3000.
- Testing shortcuts are documented above; `pnpm check` runs the standard verification pipeline.
