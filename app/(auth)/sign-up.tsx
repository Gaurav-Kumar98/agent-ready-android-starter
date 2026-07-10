import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/components/ui';
import { signUpWithEmail } from '@/features/auth/service';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await signUpWithEmail(email.trim(), password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
    }
    // Otherwise a session already exists and the (auth) layout redirects home.
  };

  if (confirmationSent) {
    return (
      <Screen className="justify-center">
        <View className="gap-2">
          <Text variant="title">Check your email</Text>
          <Text className="text-foreground-secondary">
            We sent a confirmation link to {email.trim()}. Tap it, then come back and sign in.
          </Text>
          <Link href="/sign-in" asChild>
            <Button variant="secondary" label="Back to sign in" className="mt-2" />
          </Link>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="justify-center">
      <View className="gap-4">
        <View className="gap-1">
          <Text variant="display">Create account</Text>
          <Text className="text-foreground-secondary">A minute from now you are in</Text>
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          error={error}
        />
        <Button
          testID="sign-up-button"
          label="Sign up"
          onPress={handleSignUp}
          loading={isSubmitting}
          disabled={!email || password.length < 6}
        />
        <Link href="/sign-in" asChild>
          <Button variant="ghost" label="Already have an account? Sign in" />
        </Link>
      </View>
    </Screen>
  );
}
