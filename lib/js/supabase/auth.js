/**
 * High-level auth helpers that wrap common Supabase auth operations with
 * retry logic and consistent error handling.
 *
 * These functions are thin, opinionated wrappers around `supabase.auth.*`
 * methods.  They always return `{ data, error }` tuples so callers never
 * need try/catch for expected auth failures.
 *
 * @module supabase/auth
 */

import { getClient } from './client.js';
import { withRetry } from './retry.js';

/**
 * Sign in with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signInWithPassword(email, password) {
  const client = getClient();

  return withRetry(
    () => client.auth.signInWithPassword({ email, password }),
    { maxAttempts: 2, baseDelayMs: 500 },
  );
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.).
 *
 * @param {string} provider
 * @param {object} [options]
 * @param {string} [options.redirectTo]
 * @param {string[]} [options.scopes]
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signInWithOAuth(provider, options = {}) {
  const client = getClient();

  return client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options.redirectTo,
      scopes: options.scopes?.join(' '),
    },
  });
}

/**
 * Sign in with magic link (passwordless email).
 *
 * @param {string} email
 * @param {object} [options]
 * @param {string} [options.redirectTo]
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signInWithMagicLink(email, options = {}) {
  const client = getClient();

  return withRetry(
    () =>
      client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: options.redirectTo },
      }),
    { maxAttempts: 2, baseDelayMs: 500 },
  );
}

/**
 * Sign up a new user.
 *
 * @param {string} email
 * @param {string} password
 * @param {object} [metadata]
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function signUp(email, password, metadata = {}) {
  const client = getClient();

  return withRetry(
    () =>
      client.auth.signUp({
        email,
        password,
        options: { data: metadata },
      }),
    { maxAttempts: 2, baseDelayMs: 500 },
  );
}

/**
 * Sign out the current user.  Scope `'local'` only removes the session from
 * this browser; `'global'` revokes all sessions server-side.
 *
 * @param {'local'|'global'} [scope='local']
 * @returns {Promise<{error: object|null}>}
 */
export async function signOut(scope = 'local') {
  const client = getClient();

  return client.auth.signOut({ scope });
}

/**
 * Fetch the current user from the Supabase Auth server (verified, not from
 * local cache).  Use this for security-sensitive operations.
 *
 * @returns {Promise<{data: {user: object|null}, error: object|null}>}
 */
export async function getVerifiedUser() {
  const client = getClient();

  return withRetry(
    () => client.auth.getUser(),
    { maxAttempts: 3, baseDelayMs: 1_000 },
  );
}

/**
 * Get the locally cached session (no network request).
 * Good for non-sensitive UI reads; do NOT trust for server-side authorization.
 *
 * @returns {Promise<{data: {session: object|null}, error: object|null}>}
 */
export async function getCachedSession() {
  const client = getClient();

  return client.auth.getSession();
}

/**
 * Reset password for the given email.
 *
 * @param {string} email
 * @param {object} [options]
 * @param {string} [options.redirectTo]
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function resetPassword(email, options = {}) {
  const client = getClient();

  return withRetry(
    () =>
      client.auth.resetPasswordForEmail(email, {
        redirectTo: options.redirectTo,
      }),
    { maxAttempts: 2, baseDelayMs: 500 },
  );
}

/**
 * Update the current user's metadata or credentials.
 *
 * @param {object} attributes
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateUser(attributes) {
  const client = getClient();

  return withRetry(
    () => client.auth.updateUser(attributes),
    { maxAttempts: 2, baseDelayMs: 500 },
  );
}
