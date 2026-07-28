import { describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useEntitlement } from '../use-entitlement';

const mockGetCustomerInfo = jest.fn();
const mockIsConfigured = jest.fn();

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    getCustomerInfo: () => mockGetCustomerInfo(),
    addCustomerInfoUpdateListener: () => undefined,
    removeCustomerInfoUpdateListener: () => undefined,
  },
}));

jest.mock('@/lib/revenuecat', () => ({
  isRevenueCatConfigured: () => mockIsConfigured(),
}));

// The hook reaches @/lib/query for messageFor, which pulls in the real Sentry
// SDK. Importing it leaves the Jest worker with handles it never releases
// ("failed to exit gracefully"), and none of it is under test here.
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));

/**
 * One client per test, built once so the wrapper does not throw the cache away
 * on every render. `retry: false` lets a rejected lookup settle into the error
 * state immediately; `gcTime: 0` keeps no timers alive after the test.
 */
function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useEntitlement', () => {
  it('reports true when the entitlement is active', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: { premium: {} } } } as never);

    const { result } = await renderHook(() => useEntitlement(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(true);
  });

  it('reports false when RevenueCat answers and the entitlement is absent', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } } as never);

    const { result } = await renderHook(() => useEntitlement(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(false);
  });

  it('reports null rather than false when the lookup fails', async () => {
    // The important case: collapsing an unreachable RevenueCat to `false`
    // shows a paying subscriber the upsell and asks them to pay twice.
    mockIsConfigured.mockReturnValue(true);
    mockGetCustomerInfo.mockRejectedValue(new Error('network down') as never);

    const { result } = await renderHook(() => useEntitlement(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(
      "Couldn't check your subscription. Check your connection and try again.",
    );
  });

  it('reports false, not null, when RevenueCat is not configured at all', async () => {
    mockIsConfigured.mockReturnValue(false);

    const { result } = await renderHook(() => useEntitlement(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
