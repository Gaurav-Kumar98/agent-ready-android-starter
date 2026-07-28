import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Button, Card, Screen, Text } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { queryClient } from '@/lib/query';
import { configureRevenueCat, syncRevenueCatUser } from '@/lib/revenuecat';
import { initSentry, Sentry } from '@/lib/sentry';
import { isSupabaseConfigured } from '@/lib/supabase';

initSentry();
// preventAutoHideAsync rejects if the splash screen already went away; that is
// not a failure worth crashing over, but it should still be reported.
SplashScreen.preventAutoHideAsync().catch((e: unknown) => Sentry.captureException(e));

/**
 * Expo Router renders this instead of a white screen when a route throws.
 * Without it, a render-time crash is reported to Sentry but invisible to the
 * user — they just see nothing.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Screen className="items-center justify-center gap-2">
      <Text variant="title" className="text-center">
        Something went wrong
      </Text>
      <Text className="text-center text-foreground-secondary">
        The app hit an unexpected error. Try again, and if it keeps happening please restart the
        app.
      </Text>
      <Button variant="secondary" label="Try again" onPress={() => retry()} className="mt-2" />
    </Screen>
  );
}

/** Shown when .env has not been filled in yet, instead of crashing on launch. */
function SetupScreen() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <Screen scrollable className="gap-4">
      <Text variant="display">Finish setup</Text>
      <Text className="text-foreground-secondary">
        This app needs its Supabase credentials before it can start.
      </Text>
      <Card className="gap-2">
        <Text variant="caption">1. Copy the example env file</Text>
        <Text>cp .env.example .env</Text>
        <Text variant="caption" className="mt-2">
          2. Fill in these two values from your Supabase project
        </Text>
        <Text>EXPO_PUBLIC_SUPABASE_URL</Text>
        <Text>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
        <Text variant="caption" className="mt-2">
          3. Restart the dev server
        </Text>
        <Text>npm run start</Text>
      </Card>
      <Text variant="caption">See README.md for the full per-app checklist.</Text>
    </Screen>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    configureRevenueCat();
  }, []);

  // Keep the RevenueCat identity in sync with the Supabase session, and hold
  // the splash screen until we know whether the user is signed in.
  useEffect(() => {
    if (!isLoading) {
      syncRevenueCatUser(session?.user.id ?? null);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [session, isLoading]);

  if (isLoading) {
    return null; // splash screen is still covering the app
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

function RootLayout() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <StatusBar style="auto" />
        <SetupScreen />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
