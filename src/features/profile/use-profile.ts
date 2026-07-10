import { useCallback, useEffect, useState } from 'react';

import { Sentry } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;

type ProfileState = {
  data: Profile | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * The signed-in user's profile row. Screens pass the user id from useAuth —
 * features never import each other, so this hook does not reach into
 * the auth feature itself.
 */
export function useProfile(userId: string | undefined) {
  const [state, setState] = useState<ProfileState>({ data: null, isLoading: true, error: null });

  const fetchProfile = useCallback(async (): Promise<ProfileState> => {
    if (!userId) {
      return { data: null, isLoading: false, error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      Sentry.captureException(error);
      return {
        data: null,
        isLoading: false,
        error: "Couldn't load your profile. Check your connection and try again.",
      };
    }
    return { data, isLoading: false, error: null };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((next) => {
      if (!cancelled) {
        setState(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setState(await fetchProfile());
  }, [fetchProfile]);

  return { ...state, refetch };
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);
  if (error) {
    Sentry.captureException(error);
    return { error: "Couldn't save your changes. Check your connection and try again." };
  }
  return { error: null };
}
