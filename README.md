# Cubalove

Dating app for Cubans — a Tinder-style matchmaking platform designed for the Cuban context: limited connectivity, low-end devices, and mobile-first usage. Built as an installable PWA.

> **Status:** in development. Last active March 2026. Not yet deployed to production.

## Features

- **Swipe discovery** — Tinder-style card stack with like / nope / super-like gestures (Framer Motion, touch-first)
- **Matching** — mutual likes create matches; "¡Match!" celebration screen
- **AI recommendations** — weekly batch job computing dual-embedding compatibility (`profile_embedding` vs `ideal_embedding`, cosine similarity, cross-recommendation guarantee) via Google Gemini embeddings; cached in Redis
- **Realtime chat** — 1:1 messaging between matches over Supabase Realtime (typing indicators, read receipts, image sharing)
- **Profiles** — photo upload (up to 6, client-side compression), bio, interests, geolocation with manual city fallback
- **Couple mode** ("pareja") — link accounts as a couple, shared love vault
- **Boosts & premium** — Boost system, Cubalove Plus / VIP tiers via Stripe Checkout
- **Moderation** — report flow, admin dashboard, user blocking, attention/suspension notices
- **Notifications** — Web Push (VAPID) for matches, messages, and weekly recommendations
- **Analytics** — PostHog

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API routes + server actions, Zod validation
- **Data:** Self-hosted Supabase — PostgreSQL (+ PostGIS), Auth (Google OAuth only), PostgREST, Realtime, Storage (full schema with RLS in `database.sql`)
- **Cache:** Redis (discovery queues, boosts, sessions, recommendations cache)
- **Infra:** Docker Compose stack tuned for a 4 GB VPS (Postgres, PgBouncer, Redis, Supabase services, Nginx); Dokploy + Cloudflare per `INFRA.md`; any S3-compatible object storage (Hetzner Object Storage, DO Spaces, MinIO, AWS S3)

## Project structure

```
app/                    # Next.js App Router (landing, onboarding, auth, (app)/*, admin, api/*)
components/             # UI: swipe, chat, profile, match, couple, chismes, landing
lib/                    # services (matching, recommendations, notifications), repos, hooks, supabase clients
database.sql            # Full Postgres schema + RLS policies
docker-compose.yml      # Complete self-hosted stack (Supabase + Redis + app)
Dockerfile              # Production image (Bun runtime)
AGENTS.md / CLAUDE.md   # Working agreements for AI agents
INFRA.md                # Infrastructure architecture
tests/                  # Jest unit tests + Playwright E2E
```

## Quickstart

Prerequisites: Node 20+, and Docker if you want the self-hosted backend stack.

```bash
npm install --legacy-peer-deps   # peer graph needs the legacy flag
cp .env.example .env.local        # fill in Supabase, Redis, Stripe, PostHog, Google AI keys
npm run dev
```

To run the full self-hosted stack (Postgres, Supabase services, Redis) on a VPS:

```bash
docker compose up -d
```

Key env vars (see `.env.example` for the full list): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `GOOGLE_GENERATIVE_AI_API_KEY` (recommendations), `STRIPE_*` (payments), `NEXT_PUBLIC_POSTHOG_KEY`, VAPID keys (web push).

## Tests

```bash
npm test            # Jest unit tests
npm run test:e2e    # Playwright E2E (needs the app running)
```

## Docs

- `AGENTS.md` / `CLAUDE.md` — conventions and specialized agent roles
- `INFRA.md` — infrastructure architecture (VPS, Dokploy, Cloudflare, S3-compatible storage)
- `database.sql` — database schema, triggers, and RLS policies
