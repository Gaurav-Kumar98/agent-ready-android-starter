import { describe, expect, it } from '@jest/globals';
import type { UseQueryResult } from '@tanstack/react-query';

import { messageFor, toScreenQuery, UserFacingError } from '../query-state';

const GENERIC = 'Something went wrong. Check your connection and try again.';

/** Only the fields toScreenQuery reads — the rest of UseQueryResult is noise. */
function queryResult<T>(partial: {
  data?: T;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
}) {
  return {
    data: partial.data,
    isLoading: partial.isLoading ?? false,
    isError: partial.isError ?? false,
    error: partial.error ?? null,
    refetch: () => Promise.resolve(),
  } as unknown as UseQueryResult<T>;
}

describe('messageFor', () => {
  it('passes through copy that was written for a user', () => {
    expect(messageFor(new UserFacingError("Couldn't load your profile."))).toBe(
      "Couldn't load your profile.",
    );
  });

  it('hides raw errors behind generic copy', () => {
    // A Postgres or RevenueCat message must never reach the screen.
    expect(messageFor(new Error('duplicate key value violates unique constraint'))).toBe(GENERIC);
    expect(messageFor('PGRST116')).toBe(GENERIC);
    expect(messageFor(undefined)).toBe(GENERIC);
  });
});

describe('toScreenQuery', () => {
  it('normalises undefined data to null', () => {
    expect(toScreenQuery(queryResult({})).data).toBeNull();
  });

  it('reports loading without an error', () => {
    const state = toScreenQuery(queryResult({ isLoading: true }));

    expect(state).toMatchObject({ data: null, isLoading: true, error: null });
  });

  it('surfaces user-facing copy when the query failed', () => {
    const state = toScreenQuery(
      queryResult({ isError: true, error: new UserFacingError('No connection.') }),
    );

    expect(state.error).toBe('No connection.');
  });

  it('does not report an error while the query is healthy', () => {
    expect(toScreenQuery(queryResult({ data: { id: '1' } })).error).toBeNull();
  });
});
