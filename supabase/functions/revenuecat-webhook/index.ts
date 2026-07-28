// RevenueCat webhook → subscriptions table sync.
//
// Deploy:  npx supabase functions deploy revenuecat-webhook
// Secrets: npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=<random string>
//          (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically)
//
// In the RevenueCat dashboard, set the webhook URL to this function and the
// Authorization header value to exactly REVENUECAT_WEBHOOK_SECRET.
//
// Event reference: https://www.revenuecat.com/docs/integrations/webhooks

import { timingSafeEqual } from 'node:crypto';

import { createClient } from 'npm:@supabase/supabase-js@2';

type RevenueCatEvent = {
  type: string;
  app_user_id: string;
  entitlement_ids: string[] | null;
  product_id: string | null;
  expiration_at_ms: number | null;
  /** TRANSFER only: the ids the entitlement moved away from / to. */
  transferred_from: string[] | null;
  transferred_to: string[] | null;
};

/** Constant-time compare so the secret cannot be recovered byte-by-byte. */
function secretMatches(provided: string | null, expected: string): boolean {
  if (provided === null) {
    return false;
  }
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Must stay in sync with ENTITLEMENTS in src/features/purchases/products.ts. */
const DEFAULT_ENTITLEMENT = 'premium';

const STATUS_BY_EVENT: Record<string, 'active' | 'expired' | 'billing_issue' | 'cancelled'> = {
  INITIAL_PURCHASE: 'active',
  RENEWAL: 'active',
  UNCANCELLATION: 'active',
  PRODUCT_CHANGE: 'active',
  // CANCELLATION = auto-renew turned off; access continues until
  // current_period_ends_at, which premium RLS policies must check.
  CANCELLATION: 'cancelled',
  EXPIRATION: 'expired',
  BILLING_ISSUE: 'billing_issue',
};

Deno.serve(async (req) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || !secretMatches(req.headers.get('authorization'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let event: RevenueCatEvent;
  try {
    ({ event } = await req.json());
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // TRANSFER moves an entitlement between app users. Skipping it used to leave
  // the losing account marked active forever, so revoke there explicitly; the
  // gaining account is refreshed by the purchase events that follow.
  if (event.type === 'TRANSFER') {
    const losers = (event.transferred_from ?? []).filter((id) => !id.startsWith('$RCAnonymousID:'));
    if (losers.length > 0) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .in('user_id', losers);
      if (error) {
        console.error('transfer revoke failed', error);
        return new Response('Sync failed', { status: 500 });
      }
    }
    return new Response(JSON.stringify({ transferred: losers.length }), { status: 200 });
  }

  const status = STATUS_BY_EVENT[event.type];
  if (!status) {
    // TEST, SUBSCRIBER_ALIAS, etc. — acknowledge so RevenueCat stops retrying.
    return new Response(JSON.stringify({ skipped: event.type }), { status: 200 });
  }

  // RevenueCat app_user_id is the Supabase user id (Purchases.logIn(user.id)).
  // Anonymous ids ($RCAnonymousID:...) have no profile to sync.
  if (event.app_user_id.startsWith('$RCAnonymousID:')) {
    return new Response(JSON.stringify({ skipped: 'anonymous user' }), { status: 200 });
  }

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: event.app_user_id,
    entitlement: event.entitlement_ids?.[0] ?? DEFAULT_ENTITLEMENT,
    product_id: event.product_id,
    status,
    current_period_ends_at: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('subscriptions upsert failed', error);
    // Non-2xx so RevenueCat retries with backoff.
    return new Response('Sync failed', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
