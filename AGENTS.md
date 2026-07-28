# AGENTS.md — Expo Android App Template

You are working on a production Android app built with Expo. Every rule below is
a constraint, not a suggestion. If a rule conflicts with the fastest path to
"working code", the rule wins.

This is the single contract for every coding agent working in this repo.
`CLAUDE.md` points here; do not duplicate rules into agent-specific files.

## Who you are working with

A solo developer. There is no second pair of eyes and no reviewer waiting
downstream — the checks in this file *are* the review. That has two
consequences:

- **Finish the job.** Don't hand back a half-built feature with a list of
  things left to do. If part of the scope is genuinely blocked, complete
  everything else and say plainly what you left and why.
- **Don't ask what you can determine.** Read the code, make the routine call,
  and note the assumption. Save the questions for decisions that would be
  expensive to undo — schema shape, pricing, anything that ships to users.

## Stack (do not substitute without being asked)

- Expo SDK (managed workflow) + TypeScript (strict) + Expo Router (file-based routing)
- NativeWind for styling — Tailwind classes only, no `StyleSheet.create`, no inline style objects except for dynamic values that cannot be expressed as classes
- TanStack React Query for all server state (caching, retries, dedup, refetch)
- Supabase: Postgres + Auth + Storage + Edge Functions
- RevenueCat for all monetization (wraps Google Play Billing)
- Sentry for error monitoring
- `expo-updates` for OTA, with a fingerprint runtime version
- Maestro for E2E tests, Jest + React Native Testing Library for unit tests

## Commands

- `npm run start` — dev server (dev client, not Expo Go)
- `npm run android` — build + launch dev client on emulator
- `npm run typecheck` — `tsc --noEmit` (must pass before any task is "done")
- `npm run lint` — ESLint (must pass before any task is "done")
- `npm run test` — Jest unit tests
- `npm run e2e` — Maestro flows in `.maestro/` against the running emulator
- `npx expo-doctor` — dependency/config health; must stay at 20/20
- `npx supabase db diff -f <name>` — generate migration after schema changes
- `npm run db:types` — regenerate `src/types/database.ts` from Supabase schema

## Architecture

```
app/                  # Expo Router routes ONLY — thin screens, no business logic
src/components/ui/    # Design-system primitives (Button, Card, Text, Input...)
src/components/       # Composed feature components
src/features/<name>/  # Feature logic: hooks, services, types per feature
src/lib/              # Clients: supabase.ts, revenuecat.ts, sentry.ts, query.ts
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
- Server state goes through React Query — never a hand-rolled
  `useState` + `useEffect` fetch. Wrap the `useQuery` result in `toScreenQuery`
  (`src/lib/query.ts`) to get the contract above. Mutations use `useMutation`
  and invalidate the affected query key on success.
- A `queryFn` that fails throws `UserFacingError` with copy written for a human.
  Anything else that escapes is reported to Sentry and shown as generic copy,
  so a raw Postgres or RevenueCat message can never reach the screen. Do not
  call `Sentry.captureException` inside a `queryFn` — the shared `queryCache`
  already reports every failure.

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
- Any screen containing a text input uses `<Screen scrollable>`. The soft
  keyboard covers roughly half a 360px-tall viewport; a centred, non-scrolling
  form hides its own submit button.
- Sizing classes follow the token scale, so `w-12` is 48px, not "half the
  screen". Use `w-full` / `w-1/2` / `w-3/4` for proportional widths —
  particularly in skeletons, where a token width silently renders a stub.
- Dark mode is supported from day one: only semantic color tokens
  (`bg-surface`, `text-primary`), never `bg-white` / `text-black`.
- Lists longer than ~20 items use `FlashList`, never `ScrollView` + `map`.
- Images: use `expo-image` with a `placeholder` (blurhash) and explicit
  dimensions. No layout shift.
- Inputs are labelled for screen readers: the visible label is wired to the
  field, not just rendered above it.

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
  policies enforcing ownership. `supabase/migrations/0002_avatars_storage.sql`
  is the pattern to copy for any new bucket.
- Every SQL function declares `set search_path = ''` and schema-qualifies its
  references, `security definer` or not.

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
- Webhook secrets are compared in constant time, and every event type that
  changes entitlement ownership (including `TRANSFER`) updates the
  `subscriptions` table. Silently skipping an event leaves a stale row that
  grants premium forever.

## Errors & monitoring

- No silent `catch` blocks. Every catch either handles the error meaningfully
  or reports it: `Sentry.captureException(e)` plus a user-visible fallback.
- Render-time crashes are caught by the `ErrorBoundary` exported from
  `app/_layout.tsx`. Reporting a crash is not enough — the user must see
  something other than a white screen.
- User-facing error copy is human ("Couldn't save your changes. Check your
  connection and try again."), never raw error messages or codes.
- Never `throw` at module scope for missing configuration. The app must boot
  far enough to explain what is wrong — see the setup screen in
  `app/_layout.tsx` and `isSupabaseConfigured` in `src/lib/supabase.ts`.

## Security & secrets

- `EXPO_PUBLIC_*` env vars are bundled into the shipped app and are PUBLIC.
  Only the Supabase URL, Supabase anon key, RevenueCat public API key, and
  Sentry DSN may use this prefix. Anything else secret goes in EAS Secrets or
  Supabase Edge Function secrets.
- Never read, print, or commit `.env*` files. Never commit `google-services.json`
  credentials beyond what the template already tracks.

## Workflow expectations

- Work in small increments. After each meaningful change: typecheck and lint
  must pass. Do not fight the hooks — fix the code.
- The guards in `.claude/hooks/` are plain Node scripts wired up by
  `.claude/settings.json` (Claude Code). They depend on nothing but Node, so
  they cannot silently no-op on a machine that is missing extra tooling, and
  they fail closed: an unreadable payload blocks the action rather than
  allowing it. If you add a guard, keep both properties.
- Before declaring any task done: `npm run typecheck && npm run lint && npm run test`,
  and for UI changes, state which screen/flow you verified on the emulator and
  update or add the relevant Maestro flow in `.maestro/`.
- Report honestly. If you could not run something — no emulator, no Maestro
  installed — say so instead of implying it passed.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`...). Keep PRs under
  ~400 changed lines so CodeRabbit reviews stay useful.
- Never run `eas build`, `eas submit`, or `eas update` unless explicitly asked.
- If a task is ambiguous, list your assumptions at the top of your response
  before writing code — do not silently pick an interpretation.

## Definition of done (checklist for every feature)

1. Typecheck, lint, unit tests pass; `npx expo-doctor` still 20/20
2. Loading / error / empty states implemented
3. Works in dark mode and at 360px width, with the keyboard open if there are inputs
4. RLS policies cover any new tables/columns
5. Maestro flow added or updated for the happy path
6. No new hardcoded colors, spacing, strings-with-secrets, or product IDs
