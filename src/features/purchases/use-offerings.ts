import { useCallback, useEffect, useState } from 'react';
import Purchases, { type PurchasesOffering } from 'react-native-purchases';

import { isRevenueCatConfigured } from '@/lib/revenuecat';
import { Sentry } from '@/lib/sentry';

type OfferingsState = {
  data: PurchasesOffering | null;
  isLoading: boolean;
  error: string | null;
};

/** The current RevenueCat offering (packages shown on the paywall). */
export function useOfferings() {
  const [state, setState] = useState<OfferingsState>({ data: null, isLoading: true, error: null });

  const fetchOfferings = useCallback(async (): Promise<OfferingsState> => {
    // Template not wired to RevenueCat yet — paywall shows its empty state.
    if (!isRevenueCatConfigured()) {
      return { data: null, isLoading: false, error: null };
    }
    try {
      const offerings = await Purchases.getOfferings();
      return { data: offerings.current, isLoading: false, error: null };
    } catch (e) {
      Sentry.captureException(e);
      return {
        data: null,
        isLoading: false,
        error: "Couldn't load subscription options. Check your connection and try again.",
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOfferings().then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchOfferings]);

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setState(await fetchOfferings());
  }, [fetchOfferings]);

  return { ...state, refetch };
}
