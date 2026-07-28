import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from './animated';

export type SkeletonProps = {
  /**
   * Size the placeholder with token classes. Use proportional widths
   * (`w-full`, `w-1/2`) — `w-12` is 48px on the spacing scale, not half the
   * screen, and renders a stub instead of a placeholder bar.
   */
  className?: string;
};

/** Loading placeholder block. Compose several to sketch the loaded layout. */
export function Skeleton({ className = '' }: SkeletonProps) {
  const opacity = useSharedValue(0.7);
  // Respect the OS "remove animations" setting — a pulsing screen is a
  // migraine and a vestibular trigger, not a nice touch.
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
  }, [opacity, reducedMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <AnimatedView style={style} className={`rounded-sm bg-border ${className}`} />;
}
