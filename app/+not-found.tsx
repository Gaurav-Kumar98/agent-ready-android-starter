import { Link, Stack } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen className="items-center justify-center gap-2">
        <Text variant="title">This screen does not exist</Text>
        <Link href="/" asChild>
          <Button variant="secondary" label="Go home" className="mt-2" />
        </Link>
      </Screen>
    </>
  );
}
