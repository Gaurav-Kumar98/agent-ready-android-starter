import { KeyboardAvoidingView, Platform, ScrollView, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export type ScreenProps = ViewProps & {
  className?: string;
  edges?: readonly Edge[];
  /**
   * Wrap the content so the soft keyboard cannot cover it. Required on any
   * screen with a text input — on a 360px-wide Android the keyboard eats
   * roughly half the viewport and will otherwise hide the submit button.
   */
  scrollable?: boolean;
  /** Extra classes for the scroll content container when `scrollable`. */
  contentClassName?: string;
};

/** Base wrapper for every screen: safe areas + semantic background. */
export function Screen({
  className = '',
  edges = ['top', 'bottom'],
  scrollable = false,
  contentClassName = '',
  children,
  ...props
}: ScreenProps) {
  if (!scrollable) {
    return (
      <SafeAreaView edges={edges} className={`flex-1 bg-background px-4 ${className}`} {...props}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-background ${className}`} {...props}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          testID="screen-scroll"
          className="flex-1"
          contentContainerClassName={`grow justify-center px-4 ${contentClassName}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
