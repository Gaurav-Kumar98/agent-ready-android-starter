import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { messageFor, UserFacingError } from '@/lib/query';
import { isRevenueCatConfigured } from '@/lib/revenuecat';

import { ENTITLEMENTS, type EntitlementId } from './products';
import { purchaseKeys } from './use-offerings';

/**
 * Whether the current user has an active entitlement, straight from
 * RevenueCat's customer info (never a homegrown boolean). RevenueCat pushes
 * updates through its own listener, so that writes into the query cache and
 * every consumer of this hook re-renders.
 */
export function useEntitlement(entitlement: EntitlementId = ENTITLEMENTS.premium) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: purchaseKeys.customerInfo,
    queryFn: async (): Promise<CustomerInfo | null> => {
      // Template not wired to RevenueCat yet — treat as free tier.
      if (!isRevenueCatConfigured()) {
        return null;
      }
      try {
        return await Purchases.getCustomerInfo();
      } catch (e) {
        throw new UserFacingError(
          "Couldn't check your subscription. Check your connection and try again.",
          { cause: e },
        );
      }
    },
  });

  useEffect(() => {
    if (!isRevenueCatConfigured()) {
      return;
    }
    const onCustomerInfoUpdate = (info: CustomerInfo) => {
      queryClient.setQueryData(purchaseKeys.customerInfo, info);
    };
    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
    };
  }, [queryClient]);

  return {
    data: query.data ? query.data.entitlements.active[entitlement] !== undefined : false,
    isLoading: query.isLoading,
    error: query.isError ? messageFor(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
