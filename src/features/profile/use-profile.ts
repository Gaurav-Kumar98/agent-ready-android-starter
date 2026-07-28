import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toScreenQuery, UserFacingError } from '@/lib/query';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;

export const profileKeys = {
  detail: (userId: string | undefined) => ['profile', userId] as const,
};

/**
 * The signed-in user's profile row. Screens pass the user id from useAuth —
 * features never import each other, so this hook does not reach into
 * the auth feature itself.
 */
export function useProfile(userId: string | undefined) {
  const query = useQuery({
    queryKey: profileKeys.detail(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .maybeSingle();
      if (error) {
        throw new UserFacingError(
          "Couldn't load your profile. Check your connection and try again.",
          { cause: error },
        );
      }
      return data;
    },
  });

  return toScreenQuery(query);
}

/** Saves the display name and refreshes the cached profile on success. */
export function useUpdateDisplayName(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userId as string);
      if (error) {
        throw new UserFacingError(
          "Couldn't save your changes. Check your connection and try again.",
          { cause: error },
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) }),
  });
}
