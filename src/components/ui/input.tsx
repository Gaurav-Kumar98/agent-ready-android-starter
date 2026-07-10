import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  className?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label ? <Text variant="caption">{label}</Text> : null}
      <TextInput
        className={`min-h-touch rounded-md border bg-surface px-3 py-2 text-body text-foreground placeholder:text-foreground-muted ${
          error ? 'border-danger' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
