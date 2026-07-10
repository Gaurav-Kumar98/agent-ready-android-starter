import { View } from 'react-native';

export type SkeletonProps = {
  /** Size the placeholder with token classes, e.g. "h-4 w-8" */
  className?: string;
};

/** Loading placeholder block. Compose several to sketch the loaded layout. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <View className={`rounded-sm bg-border opacity-70 ${className}`} />;
}
