import { View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

export type EmptyStateProps = {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text variant="title" className="text-center">
        {title}
      </Text>
      <Text className="text-center text-foreground-secondary">{message}</Text>
      {action ? (
        <Button variant="secondary" label={action.label} onPress={action.onPress} className="mt-2" />
      ) : null}
    </View>
  );
}
