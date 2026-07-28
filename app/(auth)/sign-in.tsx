import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signInWithEmail } from '@/features/auth/service';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await signInWithEmail(email.trim(), password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
    // On success the auth listener flips the session and the (auth) layout
    // redirects to home — nothing to do here.
  };

  return (
    <Screen scrollable>
      <View className="gap-4">
        <View className="gap-1">
          <Text variant="display">Welcome back</Text>
          <Text className="text-foreground-secondary">Sign in to continue</Text>
        </View>
        <Input
          testID="email-input"
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          testID="password-input"
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="Your password"
          error={error}
        />
        <Button
          testID="sign-in-button"
          label="Sign in"
          onPress={handleSignIn}
          loading={isSubmitting}
          disabled={!email || !password}
        />
        <Link href="/sign-up" asChild>
          <Button variant="ghost" label="No account yet? Sign up" />
        </Link>
      </View>
    </Screen>
  );
}
