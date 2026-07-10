# CLAUDE.md — Expo Android App Template

You are working on a production Android app built with Expo. Every rule below is
a constraint, not a suggestion. If a rule conflicts with the fastest path to
"working code", the rule wins.

## Stack (do not substitute without being asked)

- Expo SDK (managed workflow) + TypeScript (strict) + Expo Router (file-based routing)
- NativeWind for styling — Tailwind classes only, no `StyleSheet.create`, no inline style objects except for dynamic values that cannot be expressed as classes
- Supabase: Postgres + Auth + Storage + Edge Functions
- RevenueCat for all monetization (wraps Google Play Billing)
- Sentry for error monitoring
- Maestro for E2E tests, Jest + React Native Testing Library for unit tests

## Commands

- `npm run start` — dev server (dev client, not Expo Go)
- `npm run android` — build + launch dev client on emulator
- `npm run typecheck` — `tsc --noEmit` (must pass before any task is "done")
- `npm run lint` — ESLint (must pass before any task is "done")
- `npm run test` — Jest unit tests
- `npm run e2e` — Maestro flows in `.maestro/` against the running emulator
- `npx supabase db diff -f <name>` — generate migration after schema changes
- `npm run db:types` — regenerate `src/types/database.ts` from Supabase schema

## Architecture

```
app/                  # Expo Router routes ONLY — thin screens, no business logic
src/components/ui/    # Design-system primitives (Button, Card, Text, Input...)
src/components/       # Composed feature components
src/features/<name>/  # Feature logic: hooks, services, types per feature
src/lib/              # Clients: supabase.ts, revenuecat.ts, sentry.ts
src/hooks/            # Shared hooks
src/types/            # Shared types incl. generated database.ts
supabase/migrations/  # SQL migrations (source of truth for schema)
supabase/functions/   # Edge Functions (webhooks, server-side logic)
.maestro/             # E2E flows
```

Rules:
- Screens in `app/` may only compose components and call feature hooks. Data
  fetching, mutations, and business rules live in `src/features/`.
- Never import `src/features/A` from `src/features/B`. Shared logic moves to
  `src/lib/` or `src/hooks/`.
- Every data-fetching hook returns `{ data, isLoading, error }` and every screen
  renders all three states plus an empty state. A screen with no loading/error
  handling is incomplete, even if it "works".

## Design system — this is why the apps look good

- Use ONLY tokens defined in `tailwind.config.js` (colors, spacing, radii,
  font sizes). Never hardcode hex values or arbitrary pixel values like
  `p-[13px]`. If a needed token doesn't exist, add it to the config first.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Nothing else.
- Typography goes through the `<Text>` primitive in `src/components/ui/` with
  its `variant` prop (`display`, `title`, `body`, `caption`). Never use raw
  React Native `Text` in screens.
- Touch targets: minimum 44x44. Interactive elements give pressed-state
  feedback (opacity or scale).
- Every screen respects safe areas (`react-native-safe-area-context`) and is
  tested at 360px width (common budget Android) — no horizontal overflow.
- Dark mode is supported from day one: only semantic color tokens
  (`bg-surface`, `text-primary`), never `bg-white` / `text-black`.
- Lists longer than ~20 items use `FlashList`, never `ScrollView` + `map`.
- Images: use `expo-image` with a `placeholder` (blurhash) and explicit
  dimensions. No layout shift.

## Supabase rules

- Row Level Security is enabled on EVERY table. A migration that creates a
  table without RLS policies in the same file is wrong.
- The client uses the anon key only. The service-role key exists exclusively
  inside Edge Function secrets — if it appears anywhere under `src/` or `app/`,
  that is a critical bug.
- All queries go through the typed client (`Database` generic from
  `src/types/database.ts`). After any schema change: run the migration, then
  `npm run db:types`, then fix resulting type errors.
- Storage: user uploads go to per-user paths (`{user_id}/...`) with storage
  policies enforcing ownership.

## Payments (RevenueCat)

- Feature gating reads RevenueCat entitlements (`customerInfo.entitlements`),
  never a homegrown `is_premium` boolean as the source of truth.
- The client is never trusted for premium status in backend logic: Supabase
  data access for premium features is validated server-side via the RevenueCat
  webhook → Edge Function → `subscriptions` table sync.
- Wrap all purchase calls in try/catch handling `PURCHASE_CANCELLED` silently
  and reporting other errors to Sentry.
- Never hardcode product IDs in components — they live in
  `src/features/purchases/products.ts`.

## Errors & monitoring

- No silent `catch` blocks. Every catch either handles the error meaningfully
  or reports it: `Sentry.captureException(e)` plus a user-visible fallback.
- User-facing error copy is human ("Couldn't save your changes. Check your
  connection and try again."), never raw error messages or codes.

## Security & secrets

- `EXPO_PUBLIC_*` env vars are bundled into the shipped app and are PUBLIC.
  Only the Supabase URL, Supabase anon key, RevenueCat public API key, and
  Sentry DSN may use this prefix. Anything else secret goes in EAS Secrets or
  Supabase Edge Function secrets.
- Never read, print, or commit `.env*` files. Never commit `google-services.json`
  credentials beyond what the template already tracks.

## Workflow expectations

- Work in small increments. After each meaningful change: typecheck and lint
  must pass (hooks enforce this — do not fight the hooks, fix the code).
- Before declaring any task done: `npm run typecheck && npm run lint && npm run test`,
  and for UI changes, state which screen/flow you verified on the emulator and
  update or add the relevant Maestro flow in `.maestro/`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`...). Keep PRs under
  ~400 changed lines so CodeRabbit reviews stay useful.
- Never run `eas build`, `eas submit`, or `eas update` unless explicitly asked.
- If a task is ambiguous, list your assumptions at the top of your response
  before writing code — do not silently pick an interpretation.

## Definition of done (checklist for every feature)

1. Typecheck, lint, unit tests pass
2. Loading / error / empty states implemented
3. Works in dark mode and at 360px width
4. RLS policies cover any new tables/columns
5. Maestro flow added or updated for the happy path
6. No new hardcoded colors, spacing, strings-with-secrets, or product IDs
