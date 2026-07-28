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

/** App user ids we can actually sync — anonymous ids have no Supabase user. */
function realUserIds(ids: string[] | null | undefined): string[] {
  return (ids ?? []).filter((id) => id && !id.startsWith('$RCAnonymousID:'));
}

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
  // A body that parses but carries no event would throw on `event.type` below,
  // and an uncaught throw is a 500 that RevenueCat retries forever.
  if (!event || typeof event.type !== 'string') {
    return new Response('Missing event', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // TRANSFER moves an entitlement between app users. It is the *only* event
  // RevenueCat sends for the move — there is no follow-up INITIAL_PURCHASE for
  // the gaining account — so both sides have to be settled here. Revoking only
  // the losing side leaves the person who actually paid with no row until the
  // next RENEWAL, which can be a year away, and server-side premium checks deny
  // them the whole time.
  //
  // The payload carries no product or expiry, so the gaining rows are copied
  // from the losing rows: a transfer moves the same subscription, so those
  // fields are by definition the same.
  if (event.type === 'TRANSFER') {
    const losers = realUserIds(event.transferred_from);
    const winners = realUserIds(event.transferred_to);
    const now = new Date().toISOString();

    let moved: {
      entitlement: string;
      product_id: string | null;
      current_period_ends_at: string | null;
    }[] = [];
    if (losers.length > 0 && winners.length > 0) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('entitlement, product_id, current_period_ends_at')
        .in('user_id', losers);
      if (error) {
        console.error('transfer read failed', error);
        return new Response('Sync failed', { status: 500 });
      }
      moved = data ?? [];
    }

    // `user_id` is the primary key, so each winner gets exactly one row — a row
    // per source would make the upsert "affect row a second time" and fail. If
    // several accounts fed the transfer, keep the longest-lived subscription.
    const source = moved.reduce<(typeof moved)[number] | undefined>((best, row) => {
      if (!best) return row;
      if (!best.current_period_ends_at || !row.current_period_ends_at) {
        // A null expiry is a lifetime/non-expiring grant — it always wins.
        return best.current_period_ends_at ? row : best;
      }
      return row.current_period_ends_at > best.current_period_ends_at ? row : best;
    }, undefined);

    // Grant before revoking: if the second write fails, RevenueCat retries and
    // the worst case is both sides briefly active, never both inactive.
    const grants = source
      ? winners.map((userId) => ({
          user_id: userId,
          entitlement: source.entitlement ?? DEFAULT_ENTITLEMENT,
          product_id: source.product_id,
          status: 'active' as const,
          current_period_ends_at: source.current_period_ends_at,
          updated_at: now,
        }))
      : [];
    if (grants.length > 0) {
      const { error } = await supabase.from('subscriptions').upsert(grants);
      if (error) {
        console.error('transfer grant failed', error);
        return new Response('Sync failed', { status: 500 });
      }
    } else if (winners.length > 0) {
      // Nothing to copy — the subscription came from an anonymous id we never
      // synced. The client still reads entitlements straight from RevenueCat,
      // and the next renewal writes the row, but flag it: until then the
      // server-side check under-reports this user.
      console.warn('transfer: no source row to copy for', winners.join(', '));
    }

    if (losers.length > 0) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: now })
        .in('user_id', losers);
      if (error) {
        console.error('transfer revoke failed', error);
        return new Response('Sync failed', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ revoked: losers.length, granted: grants.length }), {
      status: 200,
    });
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
