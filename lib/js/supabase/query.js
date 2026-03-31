/**
 * Session-aware data query wrapper.
 *
 * Wraps Supabase `from().select()` (and similar) calls so they automatically
 * retry on transient failures and refresh the session token when a 401 is
 * returned mid-flight.  This solves the root cause of "projects / pictures
 * stop loading after inactivity" — a stale token produces a 401, and without
 * transparent retry the UI just shows empty state.
 *
 * @module supabase/query
 */

import { getClient } from './client.js';
import { withRetry, isRetryable } from './retry.js';

/**
 * Execute a Supabase query callback with automatic retry and transparent
 * token refresh on 401.
 *
 * Usage:
 *   const { data, error } = await query(sb => sb.from('projects').select('*'));
 *
 * @template T
 * @param {(client: import('@supabase/supabase-js').SupabaseClient) => PromiseLike<{data: T, error: object|null}>} fn
 * @param {object} [opts]
 * @param {number} [opts.maxAttempts=3]
 * @param {import('./session.js').SessionManager} [opts.sessionManager]
 * @returns {Promise<{data: T|null, error: object|null}>}
 */
export async function query(fn, opts = {}) {
  const client = getClient();
  const maxAttempts = opts.maxAttempts ?? 3;
  const sessionManager = opts.sessionManager;

  let refreshedOnce = false;

  return withRetry(
    async (_attempt) => {
      const result = await fn(client);

      if (result.error && result.error.status === 401 && !refreshedOnce) {
        refreshedOnce = true;

        if (sessionManager) {
          try {
            await sessionManager.forceRefresh();
          } catch { /* will be caught by outer retry */ }
        } else {
          await client.auth.refreshSession();
        }

        return fn(client);
      }

      return result;
    },
    {
      maxAttempts,
      baseDelayMs: 800,
      retryIf: (err) => {
        if (err?.status === 401) return false;
        return isRetryable(err);
      },
    },
  );
}

/**
 * Convenience shorthand for simple select queries.
 *
 * @param {string} table
 * @param {string} [columns='*']
 * @param {object} [opts]
 * @param {object} [opts.filters] - key/value pairs passed to `.eq()`
 * @param {number} [opts.limit]
 * @param {import('./session.js').SessionManager} [opts.sessionManager]
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
export async function selectFrom(table, columns = '*', opts = {}) {
  return query(
    (sb) => {
      let q = sb.from(table).select(columns);

      if (opts.filters) {
        for (const [col, val] of Object.entries(opts.filters)) {
          q = q.eq(col, val);
        }
      }

      if (typeof opts.limit === 'number') {
        q = q.limit(opts.limit);
      }

      return q;
    },
    { sessionManager: opts.sessionManager },
  );
}
