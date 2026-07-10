import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

const variantClasses = {
  display: 'text-display text-foreground',
  title: 'text-title text-foreground',
  body: 'text-body text-foreground',
  caption: 'text-caption text-foreground-secondary',
} as const;

export type TextVariant = keyof typeof variantClasses;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  className?: string;
};

/**
 * The only way text is rendered in this app. Raw React Native Text is
 * lint-banned outside src/components/ui so typography stays on the scale.
 */
export function Text({ variant = 'body', className = '', ...props }: TextProps) {
  return <RNText className={`${variantClasses[variant]} ${className}`} {...props} />;
}
