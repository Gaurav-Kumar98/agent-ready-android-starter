import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { signOut } from '@/features/auth/service';
import { useEntitlement } from '@/features/purchases/use-entitlement';

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: isPremium, isLoading: isEntitlementLoading } = useEntitlement();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    if (result.error) {
      setSignOutError(result.error);
    }
    // On success the (app) layout redirects to sign-in.
  };

  return (
    <Screen className="gap-4 pt-4">
      <Text variant="display">Settings</Text>
      <Card className="gap-1">
        <Text variant="caption">Signed in as</Text>
        <Text>{session?.user.email}</Text>
      </Card>
      <Card className="gap-2">
        <Text variant="caption">Subscription</Text>
        <Text>{isEntitlementLoading ? 'Checking…' : isPremium ? 'Premium' : 'Free plan'}</Text>
        {!isPremium && !isEntitlementLoading ? (
          <Button
            variant="secondary"
            label="Upgrade to Premium"
            onPress={() => router.push('/paywall')}
          />
        ) : null}
      </Card>
      <View className="gap-1">
        <Button
          testID="sign-out-button"
          variant="danger"
          label="Sign out"
          onPress={handleSignOut}
          loading={isSigningOut}
        />
        {signOutError ? (
          <Text variant="caption" className="text-danger">
            {signOutError}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
