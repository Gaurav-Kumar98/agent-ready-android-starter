import { useQuery } from '@tanstack/react-query';
import Purchases, { type PurchasesOffering } from 'react-native-purchases';

import { toScreenQuery, UserFacingError } from '@/lib/query';
import { isRevenueCatConfigured } from '@/lib/revenuecat';

export const purchaseKeys = {
  offerings: ['purchases', 'offerings'] as const,
  customerInfo: ['purchases', 'customer-info'] as const,
};

/** The current RevenueCat offering (packages shown on the paywall). */
export function useOfferings() {
  const query = useQuery({
    queryKey: purchaseKeys.offerings,
    queryFn: async (): Promise<PurchasesOffering | null> => {
      // Template not wired to RevenueCat yet — paywall shows its empty state.
      if (!isRevenueCatConfigured()) {
        return null;
      }
      try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
      } catch (e) {
        throw new UserFacingError(
          "Couldn't load subscription options. Check your connection and try again.",
          { cause: e },
        );
      }
    },
  });

  return toScreenQuery(query);
}
