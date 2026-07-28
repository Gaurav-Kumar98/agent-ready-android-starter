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

  it('does not add a scroll view by default', async () => {
    await render(
      <Screen>
        <RNText>Static</RNText>
      </Screen>,
    );

    expect(screen.queryByTestId('screen-scroll')).toBeNull();
  });
});
