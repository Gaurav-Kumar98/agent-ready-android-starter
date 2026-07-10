/**
 * The single source of truth for RevenueCat identifiers. Components never
 * hardcode these — they import from here.
 */
export const ENTITLEMENTS = {
  premium: 'premium',
} as const;

export type EntitlementId = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

/** Google Play product IDs — must match the RevenueCat dashboard. */
export const PRODUCT_IDS = {
  premiumMonthly: 'premium_monthly',
  premiumYearly: 'premium_yearly',
} as const;
