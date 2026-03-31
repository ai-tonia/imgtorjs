/**
 * Singleton Supabase client with production-grade auth configuration.
 *
 * Key design decisions aligned with Supabase best practices (2025-2026):
 *
 *  - `persistSession: true`  — survive page reloads
 *  - `autoRefreshToken: true` — SDK proactively refreshes ≈90 s before expiry
 *  - `detectSessionInUrl: true` — handle OAuth/magic-link callback tokens
 *  - `flowType: 'pkce'` — most secure flow; recommended for all new apps
 *  - Custom `storageKey` avoids collisions when multiple Supabase projects
 *    coexist on the same origin
 *
 * The client is created lazily on first access and never re-created.
 * Framework integrations (React context, Svelte stores, etc.) should import
 * `getClient()` rather than calling `createClient` directly.
 *
 * @module supabase/client
 */

import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'imgtor-supabase-auth';

let _client = null;
let _config = null;

/**
 * @typedef {object} SupabaseConfig
 * @property {string} url          - Supabase project URL
 * @property {string} anonKey      - Supabase publishable anon key
 * @property {string} [storageKey] - localStorage key for token persistence
 * @property {object} [auth]       - Additional auth options merged into defaults
 */

/**
 * Initialise the module-level configuration.  Must be called once before
 * `getClient()`.  Calling it again with different values throws to prevent
 * silent misconfiguration.
 *
 * @param {SupabaseConfig} config
 */
export function configure(config) {
  if (!config?.url || !config?.anonKey) {
    throw new Error(
      'supabase/client: configure() requires { url, anonKey }',
    );
  }

  if (_config && (_config.url !== config.url || _config.anonKey !== config.anonKey)) {
    throw new Error(
      'supabase/client: configure() was called twice with different credentials. ' +
      'Create a second client explicitly if you need multiple projects.',
    );
  }

  _config = { ...config };
}

/**
 * Return the singleton Supabase client instance.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getClient() {
  if (_client) return _client;

  if (!_config) {
    throw new Error(
      'supabase/client: call configure({ url, anonKey }) before getClient()',
    );
  }

  _client = createClient(_config.url, _config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: _config.storageKey ?? STORAGE_KEY,
      ..._config.auth,
    },
  });

  return _client;
}

/**
 * Tear down the client (useful for tests or sign-out cleanup).
 * After calling this, `configure()` + `getClient()` can be used to create a
 * fresh instance.
 */
export function resetClient() {
  _client = null;
  _config = null;
}
