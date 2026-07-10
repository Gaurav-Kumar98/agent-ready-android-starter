import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import type { ViewProps } from 'react-native';

export type ScreenProps = ViewProps & {
  className?: string;
  edges?: readonly Edge[];
};

/** Base wrapper for every screen: safe areas + semantic background. */
export function Screen({ className = '', edges = ['top', 'bottom'], ...props }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-background px-4 ${className}`} {...props} />
  );
}
