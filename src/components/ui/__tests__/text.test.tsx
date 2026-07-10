import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { Text } from '../text';

describe('Text', () => {
  it('renders children', async () => {
    await render(<Text>Hello world</Text>);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it.each(['display', 'title', 'body', 'caption'] as const)(
    'renders %s variant',
    async (variant) => {
      await render(<Text variant={variant}>Sample</Text>);
      expect(screen.getByText('Sample')).toBeTruthy();
    },
  );
});
