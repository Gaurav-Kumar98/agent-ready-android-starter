# Expo Android Template — Structure & Setup

Build this repo once, mark it as a GitHub template repo, and every new app
starts as "Use this template" + a find-replace of the app identity. Target:
new-app-to-first-emulator-run in under 30 minutes.

## Full repo tree

```
expo-android-template/
├── CLAUDE.md                      # The contract Claude Code works under
├── .claude/
│   └── settings.json              # Hooks: auto-format, safety guards, tsc gate on Stop
├── app/                           # Expo Router — routes only
│   ├── _layout.tsx                # Root: providers (Auth, RevenueCat, Theme), Sentry init
│   ├── (auth)/                    # Unauthenticated group
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (app)/                     # Authenticated group (guarded in _layout)
│   │   ├── _layout.tsx            # Tab navigator
│   │   ├── index.tsx              # Home
│   │   ├── settings.tsx
│   │   └── paywall.tsx            # RevenueCat offerings screen
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   └── ui/                    # Button, Text, Input, Card, Screen, Skeleton,
│   │                              # EmptyState, ErrorState — the design system
│   ├── features/
│   │   ├── auth/                  # useAuth, session handling, sign-in/out logic
│   │   ├── purchases/             # usePurchases, useEntitlement, products.ts
│   │   └── profile/               # example feature slice to copy from
│   ├── lib/
│   │   ├── supabase.ts            # Typed client, SecureStore-backed session storage
│   │   ├── revenuecat.ts          # Purchases.configure, log-in/out sync with auth
│   │   └── sentry.ts
│   ├── hooks/
│   └── types/
│       └── database.ts            # GENERATED — never hand-edit
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 0001_profiles.sql      # profiles + subscriptions tables, RLS from line 1
│   └── functions/
│       └── revenuecat-webhook/    # Syncs entitlement events → subscriptions table
│           └── index.ts
├── .maestro/
│   ├── smoke.yaml                 # App launches, home renders
│   └── auth.yaml                  # Sign up → land on home
├── assets/                        # Icon, splash (replace per app)
├── tailwind.config.js             # Semantic tokens: surface, primary, text-*, spacing scale
├── app.config.ts                  # Dynamic config; reads env for IDs, wires Sentry plugin
├── eas.json                       # dev / preview / production build profiles
├── .env.example                   # Every EXPO_PUBLIC_ var documented, no values
├── .github/
│   └── workflows/
│       └── ci.yml                 # typecheck + lint + test on PR (CodeRabbit reviews the diff)
├── tsconfig.json                  # strict: true, path alias @/* → src/*
├── .eslintrc.js / .prettierrc
└── package.json
```

## One-time setup (the template itself)

```bash
# 1. Scaffold
npx create-expo-app@latest expo-android-template
cd expo-android-template
npx expo install expo-dev-client expo-router expo-image expo-secure-store \
  react-native-safe-area-context nativewind @supabase/supabase-js \
  react-native-purchases @sentry/react-native @shopify/flash-list

# 2. TypeScript strict + ESLint + Prettier
# (set "strict": true in tsconfig, add lint/typecheck/test scripts to package.json)

# 3. Supabase local project
npx supabase init && npx supabase start
# write 0001_profiles.sql, then:
npx supabase gen types typescript --local > src/types/database.ts

# 4. Android emulator + first dev build
npx expo run:android          # local build → installs dev client on emulator

# 5. Maestro
curl -Ls https://get.maestro.mobile.dev | bash

# 6. Push to GitHub → Settings → mark as "Template repository"
#    Enable CodeRabbit on the repo (free tier reviews will be summaries only)
```

## Per-app checklist (every clone)

1. "Use this template" on GitHub, clone, `npm install`
2. Find-replace app identity: name, slug, `android.package` in `app.config.ts`
3. New Supabase project → set `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY`,
   `npx supabase link`, `npx supabase db push`
4. New Sentry project → DSN; new RevenueCat project → public API key
5. Deploy webhook: `npx supabase functions deploy revenuecat-webhook`
   and point RevenueCat webhooks at it (secret via `supabase secrets set`)
6. Replace icon/splash in `assets/`
7. `npx expo run:android` → smoke test → start building features with Claude Code
8. Deferred until launch: Play Console app, RevenueCat ↔ Play linking,
   product/entitlement setup, EAS production profile

## Environment variables (.env.example)

| Variable | Public? | Where it lives |
|---|---|---|
| EXPO_PUBLIC_SUPABASE_URL | yes | .env / EAS env |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | yes (RLS is the real security) | .env / EAS env |
| EXPO_PUBLIC_REVENUECAT_ANDROID_KEY | yes (public SDK key) | .env / EAS env |
| EXPO_PUBLIC_SENTRY_DSN | yes | .env / EAS env |
| SENTRY_AUTH_TOKEN (sourcemaps) | NO | EAS Secrets only |
| REVENUECAT_WEBHOOK_SECRET | NO | Supabase Edge Function secrets only |
| SUPABASE_SERVICE_ROLE_KEY | NO | Supabase Edge Function secrets only |

## Why these choices (for future-you)

- **Dev client over Expo Go**: RevenueCat and Sentry ship native code; Expo Go
  cannot load them. `expo run:android` builds locally for free — EAS Build
  quota is saved for release AABs.
- **Local Supabase during development**: avoids the free-tier 7-day pause
  entirely while iterating; `db push` promotes the schema when an app goes live.
- **`subscriptions` table synced by webhook**: lets Postgres/RLS gate premium
  data server-side instead of trusting the client's entitlement cache.
- **Hooks + CLAUDE.md split**: CLAUDE.md is advisory (Claude can drift);
  hooks are deterministic (they run every time). Rules that must never break —
  formatting, .env protection, tsc passing at stop — live in hooks.
- **CI runs checks, CodeRabbit reviews style/logic**: CodeRabbit never executes
  code, so CI is the only thing proving the app still compiles.
