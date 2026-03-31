/**
 * Session lifecycle manager.
 *
 * Handles the three critical failure modes that cause "projects or pictures
 * not loading after inactivity":
 *
 *  1. **Tab sleep / visibility**  — browsers throttle or freeze background
 *     tabs.  When the tab becomes visible again we immediately attempt a
 *     token refresh so the next data fetch uses a valid access token.
 *
 *  2. **Proactive refresh failure** — the SDK refreshes tokens ~90 s before
 *     expiry, but network blips can cause this to fail silently.  We detect
 *     TOKEN_REFRESHED failures via `onAuthStateChange` and kick off a manual
 *     retry with exponential backoff.
 *
 *  3. **Stale session after long inactivity** — if the device was asleep for
 *     longer than the access token lifetime, the stored session is expired.
 *     On wake-up we call `refreshSession()` which exchanges the refresh
 *     token for a new pair.  If that fails (refresh token also revoked) we
 *     emit `SESSION_EXPIRED` so the UI can prompt re-authentication.
 *
 * All public methods are idempotent and safe to call multiple times.
 *
 * @module supabase/session
 */

import { withRetry } from './retry.js';

const SESSION_STATES = Object.freeze({
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  REFRESHING: 'REFRESHING',
  EXPIRED: 'EXPIRED',
  ERROR: 'ERROR',
});

export { SESSION_STATES };

/**
 * @typedef {object} SessionManagerOptions
 * @property {import('@supabase/supabase-js').SupabaseClient} client
 * @property {(state: string, detail?: object) => void} [onStateChange]
 * @property {number} [healthCheckIntervalMs=60000] - periodic liveness probe
 * @property {number} [refreshRetryMaxAttempts=4]
 * @property {boolean} [enableVisibilityHandling=true]
 * @property {boolean} [enablePeriodicHealthCheck=true]
 */

export class SessionManager {
  /** @param {SessionManagerOptions} opts */
  constructor(opts) {
    this._client = opts.client;
    this._onStateChange = opts.onStateChange ?? (() => {});
    this._healthCheckMs = opts.healthCheckIntervalMs ?? 60_000;
    this._maxRetries = opts.refreshRetryMaxAttempts ?? 4;
    this._enableVisibility = opts.enableVisibilityHandling !== false;
    this._enableHealthCheck = opts.enablePeriodicHealthCheck !== false;

    this._state = SESSION_STATES.INITIALIZING;
    this._user = null;
    this._session = null;

    this._healthTimer = null;
    this._refreshAbort = null;
    this._authSubscription = null;
    this._boundVisibility = null;
    this._boundOnline = null;
    this._lastRefreshAt = 0;
    this._started = false;
  }

  get state() { return this._state; }
  get user() { return this._user; }
  get session() { return this._session; }

  /**
   * Boot the manager.  Reads the stored session, starts visibility listeners,
   * and begins the periodic health check.
   *
   * @returns {Promise<{user: object|null, session: object|null}>}
   */
  async start() {
    if (this._started) return { user: this._user, session: this._session };
    this._started = true;

    this._subscribeAuth();

    if (this._enableVisibility && typeof document !== 'undefined') {
      this._boundVisibility = this._handleVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this._boundVisibility);
    }

    if (typeof window !== 'undefined') {
      this._boundOnline = this._handleOnline.bind(this);
      window.addEventListener('online', this._boundOnline);
    }

    const initial = await this._resolveInitialSession();

    if (this._enableHealthCheck) {
      this._startHealthCheck();
    }

    return initial;
  }

  /**
   * Tear down all listeners, timers, and abort any in-flight refresh.
   */
  stop() {
    this._started = false;

    if (this._authSubscription) {
      this._authSubscription.unsubscribe();
      this._authSubscription = null;
    }

    if (this._boundVisibility && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._boundVisibility);
      this._boundVisibility = null;
    }

    if (this._boundOnline && typeof window !== 'undefined') {
      window.removeEventListener('online', this._boundOnline);
      this._boundOnline = null;
    }

    this._stopHealthCheck();
    this._abortRefresh();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Initial session resolution
  // ──────────────────────────────────────────────────────────────────────────

  async _resolveInitialSession() {
    try {
      const { data, error } = await withRetry(
        () => this._client.auth.getSession(),
        { maxAttempts: 2, baseDelayMs: 500 },
      );

      if (error) {
        this._transition(SESSION_STATES.UNAUTHENTICATED, { error });
        return { user: null, session: null };
      }

      if (!data.session) {
        this._transition(SESSION_STATES.UNAUTHENTICATED);
        return { user: null, session: null };
      }

      this._session = data.session;

      const { data: userData, error: userError } = await withRetry(
        () => this._client.auth.getUser(),
        { maxAttempts: 2, baseDelayMs: 500 },
      );

      if (userError || !userData?.user) {
        this._transition(SESSION_STATES.UNAUTHENTICATED, { error: userError });
        return { user: null, session: null };
      }

      this._user = userData.user;
      this._transition(SESSION_STATES.AUTHENTICATED, {
        user: this._user,
        session: this._session,
      });

      return { user: this._user, session: this._session };
    } catch (err) {
      this._transition(SESSION_STATES.ERROR, { error: err });
      return { user: null, session: null };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Auth state subscription
  // ──────────────────────────────────────────────────────────────────────────

  _subscribeAuth() {
    const { data } = this._client.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          this._session = session;
          this._user = session?.user ?? null;
          this._lastRefreshAt = Date.now();
          this._transition(SESSION_STATES.AUTHENTICATED, {
            event,
            user: this._user,
            session: this._session,
          });
          break;

        case 'SIGNED_OUT':
          this._session = null;
          this._user = null;
          this._transition(SESSION_STATES.UNAUTHENTICATED, { event });
          break;

        case 'USER_UPDATED':
          this._user = session?.user ?? this._user;
          this._session = session ?? this._session;
          this._onStateChange(this._state, { event, user: this._user });
          break;

        case 'INITIAL_SESSION':
          break;

        default:
          break;
      }
    });

    this._authSubscription = data.subscription;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Visibility & online recovery
  // ──────────────────────────────────────────────────────────────────────────

  _handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this._recoverSession('visibility');
    }
  }

  _handleOnline() {
    this._recoverSession('online');
  }

  /**
   * Attempt to recover the session when returning from a background/offline
   * state.  Debounced to avoid duplicate refreshes.
   *
   * @param {string} trigger - why recovery was triggered ('visibility' | 'online' | 'healthcheck')
   */
  async _recoverSession(trigger) {
    if (this._state === SESSION_STATES.UNAUTHENTICATED) return;
    if (this._state === SESSION_STATES.REFRESHING) return;

    const sinceLastRefresh = Date.now() - this._lastRefreshAt;
    if (sinceLastRefresh < 5_000) return;

    await this._refreshWithRetry(trigger);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Token refresh with retry
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Refresh the session with exponential backoff.  If the refresh token is
   * revoked, transitions to EXPIRED so the UI can prompt re-auth.
   *
   * @param {string} trigger
   */
  async _refreshWithRetry(trigger) {
    this._abortRefresh();
    const controller = new AbortController();
    this._refreshAbort = controller;

    this._transition(SESSION_STATES.REFRESHING, { trigger });

    try {
      const { data, error } = await withRetry(
        () => this._client.auth.refreshSession(),
        {
          maxAttempts: this._maxRetries,
          baseDelayMs: 1_000,
          maxDelayMs: 15_000,
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted) return;

      if (error) {
        const isRevoked =
          error.message?.includes('invalid refresh token') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.status === 401;

        if (isRevoked) {
          this._session = null;
          this._user = null;
          this._transition(SESSION_STATES.EXPIRED, { trigger, error });
        } else {
          this._transition(SESSION_STATES.ERROR, { trigger, error });
        }
        return;
      }

      if (data?.session) {
        this._session = data.session;
        this._user = data.session.user ?? this._user;
        this._lastRefreshAt = Date.now();
        this._transition(SESSION_STATES.AUTHENTICATED, {
          trigger,
          user: this._user,
          session: this._session,
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._transition(SESSION_STATES.ERROR, { trigger, error: err });
    } finally {
      if (this._refreshAbort === controller) {
        this._refreshAbort = null;
      }
    }
  }

  _abortRefresh() {
    if (this._refreshAbort) {
      this._refreshAbort.abort();
      this._refreshAbort = null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Periodic health check
  // ──────────────────────────────────────────────────────────────────────────

  _startHealthCheck() {
    this._stopHealthCheck();
    this._healthTimer = setInterval(() => {
      this._recoverSession('healthcheck');
    }, this._healthCheckMs);
  }

  _stopHealthCheck() {
    if (this._healthTimer) {
      clearInterval(this._healthTimer);
      this._healthTimer = null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // State machine
  // ──────────────────────────────────────────────────────────────────────────

  _transition(nextState, detail = {}) {
    const prev = this._state;
    this._state = nextState;
    this._onStateChange(nextState, { ...detail, previousState: prev });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Force a session refresh right now (e.g. before a critical data fetch).
   * Returns the refreshed session or throws.
   *
   * @returns {Promise<{user: object, session: object}>}
   */
  async forceRefresh() {
    await this._refreshWithRetry('manual');
    if (!this._session) {
      throw new Error('Session could not be refreshed');
    }
    return { user: this._user, session: this._session };
  }

  /**
   * Convenience: get a guaranteed-fresh access token string, refreshing if
   * the current token expires within `marginMs`.
   *
   * @param {number} [marginMs=60000]
   * @returns {Promise<string>}
   */
  async getAccessToken(marginMs = 60_000) {
    if (this._session) {
      const expiresAt = this._session.expires_at ?? 0;
      const nowSec = Math.floor(Date.now() / 1_000);
      if (expiresAt - nowSec > marginMs / 1_000) {
        return this._session.access_token;
      }
    }

    await this.forceRefresh();
    return this._session.access_token;
  }
}
