import { createSwitch } from '@gluestack-ui/core/switch/creator';
import { forwardRef, useEffect } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Reference for wrapping a gluestack primitive.
 *
 * gluestack v5 is headless: `createSwitch` owns the behaviour and the
 * accessibility semantics (toggle state, form-control context, disabled
 * handling) and hands them to a Root we style ourselves. So the split is:
 * gluestack decides how it behaves, `tailwind.config.js` decides how it looks,
 * Reanimated decides how it moves. Copy this shape for Actionsheet, Select,
 * AlertDialog and friends rather than importing gluestack inside `app/`.
 */

// Track is w-12 (48px) with p-1 (4px) inset; the thumb is h-4 w-4 (16px).
// 48 - 8 - 16 = 24, which is on the spacing scale.
const THUMB_TRAVEL = 24;

type SwitchRootProps = Omit<PressableProps, 'onPress'> & {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  className?: string;
  /** Injected by gluestack; not a React Native prop. */
  states?: unknown;
};

const SwitchRoot = forwardRef<View, SwitchRootProps>(function SwitchRoot(
  { value = false, onValueChange, disabled, className = '', states: _states, ...props },
  ref,
) {
  const offset = useSharedValue(value ? THUMB_TRAVEL : 0);

  useEffect(() => {
    offset.value = withTiming(value ? THUMB_TRAVEL : 0, { duration: 150 });
  }, [value, offset]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Pressable
      ref={ref}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      // The track is only 24px tall, so the Pressable carries the touch target.
      className={`min-h-touch min-w-touch justify-center ${disabled ? 'opacity-50' : ''} ${className}`}
      {...props}
    >
      <View className={`h-6 w-12 rounded-full p-1 ${value ? 'bg-primary' : 'bg-border'}`}>
        <Animated.View style={thumbStyle}>
          <View className="h-4 w-4 rounded-full bg-surface" />
        </Animated.View>
      </View>
    </Pressable>
  );
});

export const Switch = createSwitch<SwitchRootProps>({ Root: SwitchRoot });

export type SwitchProps = SwitchRootProps;
