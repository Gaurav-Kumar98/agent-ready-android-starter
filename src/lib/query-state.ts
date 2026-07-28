import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Pure mapping between React Query results and what a screen renders. Kept
 * free of the Sentry and QueryClient imports in ./query so it stays cheap to
 * unit test.
 */

/**
 * An error whose message is already written for a human. Anything else that
 * escapes a queryFn is treated as unexpected and shown as generic copy, so a
 * raw Postgres or RevenueCat string can never reach the UI.
 */
export class UserFacingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'UserFacingError';
  }
}

const GENERIC_MESSAGE = 'Something went wrong. Check your connection and try again.';

export function messageFor(error: unknown): string {
  return error instanceof UserFacingError ? error.message : GENERIC_MESSAGE;
}

/** The shape every screen in this app renders: data + loading + error + retry. */
export type ScreenQuery<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

/** Maps a React Query result onto the screen contract from AGENTS.md. */
export function toScreenQuery<T>(query: UseQueryResult<T>): ScreenQuery<T> {
  return {
    data: query.data ?? null,
    // v5 `isLoading` is `isPending && isFetching`, so a disabled query reads as
    // "not loading" rather than hanging on a skeleton forever.
    isLoading: query.isLoading,
    error: query.isError ? messageFor(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
