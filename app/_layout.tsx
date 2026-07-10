import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { configureRevenueCat, syncRevenueCatUser } from '@/lib/revenuecat';
import { initSentry, Sentry } from '@/lib/sentry';

initSentry();
SplashScreen.preventAutoHideAsync();

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
      SplashScreen.hideAsync();
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
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
