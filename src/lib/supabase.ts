import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False until .env is filled in. This used to `throw` at module scope, which
 * crashed the app on launch — before any screen could explain what was wrong.
 * The root layout checks this and renders setup instructions instead.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Placeholders keep createClient happy so the app can boot far enough to show
// the setup screen. Nothing drives traffic to them: the root layout renders the
// setup screen instead of the app, and the auto-refresh listener below stays
// unregistered while unconfigured.
const PLACEHOLDER_URL = 'http://127.0.0.1:54321';
const PLACEHOLDER_ANON_KEY = 'missing-anon-key';

// Session tokens live in the Android Keystore via SecureStore. Note the
// ~2 KB per-entry guidance: if you add large custom claims to your JWTs,
// switch to the LargeSecureStore pattern from the Supabase Expo docs.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  supabaseUrl ?? PLACEHOLDER_URL,
  supabaseAnonKey ?? PLACEHOLDER_ANON_KEY,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh tokens only while the app is foregrounded (Supabase-recommended).
// Skipped entirely when unconfigured: there is no session to refresh against a
// placeholder URL, and starting the timer would contradict the note above.
if (isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
