/**
 * Supabase session architecture — public API.
 *
 * Import everything you need from a single entry point:
 *
 *   import { configure, getClient, SessionManager, query } from './supabase/index.js';
 *
 * Quick-start:
 *
 *   1. configure({ url: '…', anonKey: '…' })
 *   2. const mgr = new SessionManager({ client: getClient(), onStateChange: … })
 *   3. await mgr.start()
 *   4. const { data } = await query(sb => sb.from('projects').select('*'))
 *
 * @module supabase
 */

export { configure, getClient, resetClient } from './client.js';

export {
  SessionManager,
  SESSION_STATES,
} from './session.js';

export {
  signInWithPassword,
  signInWithOAuth,
  signInWithMagicLink,
  signUp,
  signOut,
  getVerifiedUser,
  getCachedSession,
  resetPassword,
  updateUser,
} from './auth.js';

export { query, selectFrom } from './query.js';

export {
  withRetry,
  isRetryable,
  sleep,
  backoffDelay,
  DEFAULT_RETRY_OPTIONS,
} from './retry.js';
