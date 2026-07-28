import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { Screen } from '../screen';

describe('Screen', () => {
  it('renders its children', async () => {
    await render(
      <Screen>
        <RNText>Hello</RNText>
      </Screen>,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('puts content in a scroll view when scrollable, so the keyboard cannot cover it', async () => {
    await render(
      <Screen scrollable>
        <RNText>Password</RNText>
      </Screen>,
    );

    // A screen with inputs must be scrollable — otherwise the soft keyboard
    // hides the submit button on a 360px-wide device.
    expect(screen.getByTestId('screen-scroll')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
  });

  it('styles the content box with className when scrollable, not the outer wrapper', async () => {
    await render(
      <Screen scrollable className="gap-4">
        <RNText>Spaced</RNText>
      </Screen>,
    );

    // The SafeAreaView's only child is the KeyboardAvoidingView, so layout
    // classes left there (gap/justify/items) would silently do nothing.
    expect(screen.getByTestId('screen-scroll').props.contentContainerClassName).toContain('gap-4');
  });

  it('does not add a scroll view by default', async () => {
    await render(
      <Screen>
        <RNText>Static</RNText>
      </Screen>,
    );

    expect(screen.queryByTestId('screen-scroll')).toBeNull();
  });
});
