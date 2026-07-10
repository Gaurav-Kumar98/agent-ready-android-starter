import Purchases, { type PurchasesPackage } from 'react-native-purchases';

import { Sentry } from '@/lib/sentry';

type PurchaseResult = {
  error: string | null;
  cancelled: boolean;
};

/**
 * Runs a purchase through Google Play. A user cancelling the sheet is a
 * normal outcome and reported silently; real failures go to Sentry.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    await Purchases.purchasePackage(pkg);
    return { error: null, cancelled: false };
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'userCancelled' in e && e.userCancelled) {
      return { error: null, cancelled: true };
    }
    Sentry.captureException(e);
    return {
      error: "Couldn't complete the purchase. You haven't been charged — please try again.",
      cancelled: false,
    };
  }
}

export async function restorePurchases(): Promise<{ error: string | null }> {
  try {
    await Purchases.restorePurchases();
    return { error: null };
  } catch (e) {
    Sentry.captureException(e);
    return { error: "Couldn't restore purchases. Check your connection and try again." };
  }
}
