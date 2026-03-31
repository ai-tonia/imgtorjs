/**
 * Retry utility with exponential backoff, jitter, and abort support.
 *
 * Designed for Supabase auth operations (token refresh, getUser) and data
 * fetches that may fail transiently due to network issues or cold-start
 * latency on the auth server.
 *
 * @module supabase/retry
 */

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const RETRYABLE_ERROR_MESSAGES = [
  'Failed to fetch',
  'NetworkError',
  'network error',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'socket hang up',
  'aborted',
  'timeout',
];

export const DEFAULT_RETRY_OPTIONS = Object.freeze({
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitter: true,
  retryIf: isRetryable,
});

/**
 * Determine whether an error (or Supabase `{ error }` response) is worth
 * retrying.  Checks HTTP status codes and common network-level error strings.
 *
 * @param {Error|{status?:number,message?:string,code?:string}} err
 * @returns {boolean}
 */
export function isRetryable(err) {
  if (!err) return false;

  const status = err.status ?? err.statusCode ?? err.code;
  if (typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const msg = String(err.message ?? err ?? '');
  return RETRYABLE_ERROR_MESSAGES.some((m) => msg.includes(m));
}

/**
 * Sleep for `ms` milliseconds, respecting an optional `AbortSignal`.
 *
 * @param {number} ms
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Calculate delay for attempt `n` (0-indexed) with exponential backoff and
 * optional jitter.
 *
 * @param {number} attempt  0-indexed attempt number
 * @param {object} opts
 * @param {number} opts.baseDelayMs
 * @param {number} opts.maxDelayMs
 * @param {boolean} opts.jitter
 * @returns {number}
 */
export function backoffDelay(attempt, { baseDelayMs, maxDelayMs, jitter }) {
  const exponential = baseDelayMs * 2 ** attempt;
  const capped = Math.min(exponential, maxDelayMs);
  return jitter ? capped * (0.5 + Math.random() * 0.5) : capped;
}

/**
 * Execute `fn` with automatic retries.
 *
 * `fn` receives the current attempt index (0-based) so callers can log or
 * adjust behavior per attempt.  If `fn` returns a Supabase-style
 * `{ data, error }` tuple, the `error` value is checked against `retryIf`.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} fn
 * @param {Partial<typeof DEFAULT_RETRY_OPTIONS> & {signal?: AbortSignal}} [opts]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, opts = {}) {
  const { maxAttempts, baseDelayMs, maxDelayMs, jitter, retryIf, signal } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...opts,
  };

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const result = await fn(attempt);

      if (result && typeof result === 'object' && 'error' in result && result.error) {
        if (attempt < maxAttempts - 1 && retryIf(result.error)) {
          lastError = result.error;
          await sleep(backoffDelay(attempt, { baseDelayMs, maxDelayMs, jitter }), signal);
          continue;
        }
        return result;
      }

      return result;
    } catch (err) {
      lastError = err;

      if (err.name === 'AbortError') throw err;

      if (attempt < maxAttempts - 1 && retryIf(err)) {
        await sleep(backoffDelay(attempt, { baseDelayMs, maxDelayMs, jitter }), signal);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}
