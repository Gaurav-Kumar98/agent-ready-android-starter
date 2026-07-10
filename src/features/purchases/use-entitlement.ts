import { useEffect, useState } from 'react';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { isRevenueCatConfigured } from '@/lib/revenuecat';
import { Sentry } from '@/lib/sentry';

import { ENTITLEMENTS, type EntitlementId } from './products';

type EntitlementState = {
  data: boolean | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Whether the current user has an active entitlement, straight from
 * RevenueCat's customer info (never a homegrown boolean). Updates live via
 * the customer-info listener.
 */
export function useEntitlement(entitlement: EntitlementId = ENTITLEMENTS.premium) {
  const [state, setState] = useState<EntitlementState>(() =>
    // Template not wired to RevenueCat yet — treat as free tier.
    isRevenueCatConfigured()
      ? { data: null, isLoading: true, error: null }
      : { data: false, isLoading: false, error: null },
  );

  useEffect(() => {
    if (!isRevenueCatConfigured()) {
      return;
    }

    let active = true;

    Purchases.getCustomerInfo()
      .then((info) => {
        if (active) {
          setState({
            data: info.entitlements.active[entitlement] !== undefined,
            isLoading: false,
            error: null,
          });
        }
      })
      .catch((e) => {
        Sentry.captureException(e);
        if (active) {
          setState({
            data: null,
            isLoading: false,
            error: "Couldn't check your subscription. Check your connection and try again.",
          });
        }
      });

    const onCustomerInfoUpdate = (info: CustomerInfo) => {
      if (active) {
        setState({
          data: info.entitlements.active[entitlement] !== undefined,
          isLoading: false,
          error: null,
        });
      }
    };
    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);

    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
    };
  }, [entitlement]);

  return state;
}
