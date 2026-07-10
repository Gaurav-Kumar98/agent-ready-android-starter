import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from './text';

const variants = {
  primary: {
    container: 'bg-primary active:bg-primary-pressed',
    label: 'text-on-primary',
  },
  secondary: {
    container: 'border border-border bg-surface active:opacity-70',
    label: 'text-foreground',
  },
  ghost: {
    container: 'bg-transparent active:opacity-70',
    label: 'text-primary',
  },
  danger: {
    container: 'bg-danger active:opacity-70',
    label: 'text-on-danger',
  },
} as const;

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`min-h-touch min-w-touch flex-row items-center justify-center rounded-md px-4 py-3 ${variants[variant].container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className={`font-semibold ${variants[variant].label}`}>{label}</Text>
      )}
    </Pressable>
  );
}
