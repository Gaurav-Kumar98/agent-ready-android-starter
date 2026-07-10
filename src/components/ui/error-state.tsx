import { View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text variant="title" className="text-center">
        Something went wrong
      </Text>
      <Text className="text-center text-foreground-secondary">{message}</Text>
      {onRetry ? (
        <Button variant="secondary" label="Try again" onPress={onRetry} className="mt-2" />
      ) : null}
    </View>
  );
}
