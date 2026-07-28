import { QueryCache, QueryClient } from '@tanstack/react-query';

import { UserFacingError } from './query-state';
import { Sentry } from './sentry';

export { messageFor, toScreenQuery, UserFacingError, type ScreenQuery } from './query-state';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      // Mobile has no window focus; refetch on reconnect is the useful one.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
  // Every query failure is reported from one place, so individual hooks only
  // have to decide what the user reads.
  queryCache: new QueryCache({
    onError: (error) => {
      Sentry.captureException(error instanceof UserFacingError ? (error.cause ?? error) : error);
    },
  }),
});
