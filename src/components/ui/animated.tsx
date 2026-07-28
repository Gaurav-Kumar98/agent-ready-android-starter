import { cssInterop } from 'nativewind';
import Animated from 'react-native-reanimated';

/**
 * Reanimated components do not understand `className` on their own — NativeWind
 * only auto-registers a handful of libraries, and an unregistered component
 * silently drops the prop, so styles just never apply. Register once here and
 * import `AnimatedView` instead of `Animated.View` anywhere token classes and
 * animation need to meet.
 */
export const AnimatedView = cssInterop(Animated.View, { className: 'style' });
