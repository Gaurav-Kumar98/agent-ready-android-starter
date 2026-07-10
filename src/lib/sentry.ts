import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Called once at app start (app/_layout.tsx). No-ops when no DSN is set. */
export function initSentry() {
  if (!dsn) {
    return;
  }
  Sentry.init({
    dsn,
    // Keep sampling conservative by default; tune per app.
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    enabled: !__DEV__,
  });
}

export { Sentry };
