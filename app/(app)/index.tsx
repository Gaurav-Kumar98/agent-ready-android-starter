import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { useEntitlement } from '@/features/purchases/use-entitlement';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: profile, isLoading, error, refetch } = useProfile(session?.user.id);
  const { data: isPremium, isLoading: isEntitlementLoading } = useEntitlement();

  if (isLoading || isEntitlementLoading) {
    return (
      <Screen testID="home-screen" className="gap-3 pt-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-12 w-full" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen testID="home-screen">
        <ErrorState message={error} onRetry={refetch} />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen testID="home-screen">
        <EmptyState
          title="No profile yet"
          message="Your profile hasn't been created. Pull to refresh or contact support if this persists."
          action={{ label: 'Retry', onPress: refetch }}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="home-screen" className="gap-4 pt-4">
      <View className="gap-1">
        <Text variant="display">Home</Text>
        <Text className="text-foreground-secondary">
          Welcome back, {profile.display_name ?? session?.user.email}
        </Text>
      </View>
      {/*
        `isPremium === null` means the entitlement lookup failed. Never show the
        upsell in that case — a subscriber on a flaky connection would be told
        they are on the free plan and asked to pay again.
      */}
      <Card className="gap-2">
        <Text variant="title">
          {isPremium === null ? 'Plan unavailable' : isPremium ? 'Premium' : 'Free plan'}
        </Text>
        <Text className="text-foreground-secondary">
          {isPremium === null
            ? "We couldn't check your subscription just now. Your access is unchanged — try again in a moment."
            : isPremium
              ? 'You have full access. Thanks for supporting the app!'
              : 'Upgrade to unlock everything this app has to offer.'}
        </Text>
        {isPremium === false ? (
          <Button label="Upgrade" onPress={() => router.push('/paywall')} className="mt-2" />
        ) : null}
      </Card>
    </Screen>
  );
}
