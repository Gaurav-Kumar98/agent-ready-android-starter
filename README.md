# Expo Android Template

Production-ready starting point for Android apps: Expo (managed, dev client) +
TypeScript strict + Expo Router + NativeWind + Supabase (Auth, Postgres with
RLS, Edge Functions) + RevenueCat + Sentry, with Jest and Maestro wired up.

Ships with a working auth flow (sign up → profile row via trigger → home),
a paywall backed by RevenueCat, and a `subscriptions` table that is synced
server-side by webhook so the client is never trusted for premium status.

Built to be driven with Claude Code: [CLAUDE.md](CLAUDE.md) is the contract,
`.claude/settings.json` enforces the non-negotiables (auto-format on write,
`.env` protection, destructive-command guard, TypeScript gate on stop).

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57 (managed workflow, dev client — not Expo Go) |
| Routing | Expo Router (file-based, typed routes) |
| Styling | NativeWind — semantic tokens only, dark mode from day one |
| Backend | Supabase: Postgres + Auth + Storage + Edge Functions |
| Payments | RevenueCat (wraps Google Play Billing) |
| Monitoring | Sentry |
| Tests | Jest + React Native Testing Library, Maestro E2E |

## New app from this template

1. **Use this template** on GitHub → clone → `npm install`
2. Change the app identity constants at the top of [app.config.ts](app.config.ts)
   (name, slug, scheme, `android.package`)
3. New Supabase project → copy `.env.example` to `.env`, set
   `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then
   `npx supabase link` and `npx supabase db push`
   (or develop against the local stack: `npx supabase start`)
4. New Sentry project → `EXPO_PUBLIC_SENTRY_DSN`; new RevenueCat project →
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
5. Deploy the webhook: `npx supabase functions deploy revenuecat-webhook`,
   set its secret (`npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=...`)
   and point RevenueCat's webhook at it with that value as the
   Authorization header
6. Replace icon/splash in `assets/`
7. `npm run android` → smoke test → build features
8. Deferred until launch: Play Console app, RevenueCat ↔ Play linking,
   product/entitlement setup, EAS production builds

## Commands

| Command | What it does |
|---|---|
| `npm run start` | Dev server (dev client) |
| `npm run android` | Build + launch dev client on the emulator |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Jest unit tests |
| `npm run e2e` | Maestro flows in `.maestro/` against the running emulator |
| `npm run db:types` | Regenerate `src/types/database.ts` from the local schema |

## Environment variables

| Variable | Public? | Where it lives |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | `.env` / EAS env |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes (RLS is the real security) | `.env` / EAS env |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | yes (public SDK key) | `.env` / EAS env |
| `EXPO_PUBLIC_SENTRY_DSN` | yes | `.env` / EAS env |
| `SENTRY_AUTH_TOKEN` | **NO** | EAS Secrets only |
| `REVENUECAT_WEBHOOK_SECRET` | **NO** | Supabase Edge Function secrets only |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Supabase Edge Function secrets only |

## Architecture

```
app/                  # Expo Router routes ONLY — thin screens, no business logic
src/components/ui/    # Design-system primitives (Button, Card, Text, Input, ...)
src/features/<name>/  # Feature logic: hooks, services, types per feature
src/lib/              # Clients: supabase.ts, revenuecat.ts, sentry.ts
src/types/database.ts # Generated from the Supabase schema — never hand-edit
supabase/migrations/  # SQL migrations (source of truth for schema)
supabase/functions/   # Edge Functions (RevenueCat webhook)
.maestro/             # E2E flows
```

See [CLAUDE.md](CLAUDE.md) for the full set of rules and
[TEMPLATE_STRUCTURE.md](TEMPLATE_STRUCTURE.md) for the design rationale.

## One-time template setup (already done here)

Maestro CLI for E2E runs: `curl -Ls https://get.maestro.mobile.dev | bash`
(on Windows, install via WSL or see maestro.dev). After pushing to GitHub,
mark the repo as a **Template repository** in Settings and enable CodeRabbit.
