import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../button';

describe('Button', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);

    await fireEvent.press(screen.getByText('Save'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} loading />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
