import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from '../switch';

describe('Switch', () => {
  it('exposes switch semantics and its checked state', async () => {
    await render(<Switch value accessibilityLabel="Notifications" />);

    const control = screen.getByRole('switch');

    expect(control).toBeTruthy();
    expect(control.props.accessibilityState).toMatchObject({ checked: true });
  });

  it('toggles from the current value when pressed', async () => {
    const onValueChange = jest.fn();
    await render(<Switch value={false} onValueChange={onValueChange} />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle while disabled', async () => {
    const onValueChange = jest.fn();
    await render(<Switch value={false} onValueChange={onValueChange} isDisabled />);

    await fireEvent.press(screen.getByRole('switch'));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
