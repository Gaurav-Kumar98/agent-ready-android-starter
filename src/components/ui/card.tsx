import { View, type ViewProps } from 'react-native';

export type CardProps = ViewProps & { className?: string };

export function Card({ className = '', ...props }: CardProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-surface p-4 ${className}`}
      {...props}
    />
  );
}
