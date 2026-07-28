import { useId } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  className?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
  const labelId = useId();
  const errorId = useId();

  return (
    <View className="gap-1">
      {label ? (
        <Text nativeID={labelId} variant="caption">
          {label}
        </Text>
      ) : null}
      <TextInput
        // TalkBack reads the visible label, and the error text, as part of the
        // field — otherwise the input announces as an unlabelled edit box.
        accessibilityLabel={label}
        accessibilityLabelledBy={label ? labelId : undefined}
        accessibilityHint={error ?? undefined}
        className={`min-h-touch rounded-md border bg-surface px-3 py-2 text-body text-foreground placeholder:text-foreground-muted ${
          error ? 'border-danger' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text nativeID={errorId} variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
