import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { Sentry } from '@/lib/sentry';

const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

let configured = false;

/**
 * Called once at app start (app/_layout.tsx). No-ops when no key is set so
 * the template runs before RevenueCat is wired up.
 */
export function configureRevenueCat() {
  if (configured || !androidApiKey) {
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
  Purchases.configure({ apiKey: androidApiKey });
  configured = true;
}

export function isRevenueCatConfigured() {
  return configured;
}

/**
 * Keeps the RevenueCat identity in sync with the Supabase session so
 * entitlements follow the user across devices. Wired up in app/_layout.tsx.
 */
export async function syncRevenueCatUser(userId: string | null) {
  if (!configured) {
    return;
  }
  try {
    if (userId) {
      await Purchases.logIn(userId);
    } else {
      await Purchases.logOut();
    }
  } catch (e) {
    // logOut throws if the current user is already anonymous — harmless.
    Sentry.captureException(e);
  }
}
