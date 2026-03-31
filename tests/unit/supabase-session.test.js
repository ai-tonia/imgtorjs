import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager, SESSION_STATES } from '../../lib/js/supabase/session.js';

function mockClient({
  session = null,
  user = null,
  refreshResult = null,
  getUserResult = null,
} = {}) {
  const listeners = [];

  const refreshedSession = {
    access_token: 'new-at',
    refresh_token: 'new-rt',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: user ?? { id: 'u1' },
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: user ?? session?.user ?? null },
        error: getUserResult?.error ?? null,
      }),
      refreshSession: vi.fn().mockResolvedValue(
        refreshResult ?? {
          data: { session: refreshedSession },
          error: null,
        },
      ),
      onAuthStateChange: vi.fn((cb) => {
        listeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),

      _emit(event, session) {
        listeners.forEach((cb) => cb(event, session));
      },
    },
  };
}

describe('supabase/session — SessionManager', () => {
  let client;
  let stateChanges;
  let manager;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stateChanges = [];
    client = mockClient({
      session: {
        access_token: 'at',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: 'u1', email: 'a@b.com' },
      },
      user: { id: 'u1', email: 'a@b.com' },
    });
    manager = new SessionManager({
      client,
      onStateChange(state, detail) {
        stateChanges.push({ state, detail });
      },
      enableVisibilityHandling: false,
      enablePeriodicHealthCheck: false,
    });
  });

  afterEach(() => {
    manager.stop();
    vi.useRealTimers();
  });

  // ── Initialisation ───────────────────────────────────────────────────

  describe('start()', () => {
    it('transitions to AUTHENTICATED when session + user exist', async () => {
      const result = await manager.start();
      expect(result.user).toEqual({ id: 'u1', email: 'a@b.com' });
      expect(result.session).toBeTruthy();
      expect(manager.state).toBe(SESSION_STATES.AUTHENTICATED);
    });

    it('transitions to UNAUTHENTICATED when no session', async () => {
      client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      const result = await manager.start();
      expect(result.user).toBeNull();
      expect(manager.state).toBe(SESSION_STATES.UNAUTHENTICATED);
    });

    it('transitions to UNAUTHENTICATED on getSession error', async () => {
      client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'fail' },
      });
      const result = await manager.start();
      expect(result.user).toBeNull();
      expect(manager.state).toBe(SESSION_STATES.UNAUTHENTICATED);
    });

    it('is idempotent', async () => {
      await manager.start();
      await manager.start();
      expect(client.auth.getSession).toHaveBeenCalledTimes(1);
    });
  });

  // ── Auth state subscription ──────────────────────────────────────────

  describe('onAuthStateChange handling', () => {
    it('updates user/session on SIGNED_IN event', async () => {
      await manager.start();
      const newSession = {
        access_token: 'new-at',
        user: { id: 'u2' },
      };
      client.auth._emit('SIGNED_IN', newSession);
      expect(manager.user).toEqual({ id: 'u2' });
      expect(manager.session).toBe(newSession);
    });

    it('clears user/session on SIGNED_OUT event', async () => {
      await manager.start();
      client.auth._emit('SIGNED_OUT', null);
      expect(manager.user).toBeNull();
      expect(manager.session).toBeNull();
      expect(manager.state).toBe(SESSION_STATES.UNAUTHENTICATED);
    });

    it('updates user on USER_UPDATED event', async () => {
      await manager.start();
      client.auth._emit('USER_UPDATED', {
        access_token: 'at',
        user: { id: 'u1', email: 'new@email.com' },
      });
      expect(manager.user.email).toBe('new@email.com');
    });
  });

  // ── stop() ───────────────────────────────────────────────────────────

  describe('stop()', () => {
    it('unsubscribes from onAuthStateChange', async () => {
      await manager.start();
      const sub = client.auth.onAuthStateChange.mock.results[0].value.data.subscription;
      manager.stop();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });

  // ── forceRefresh ─────────────────────────────────────────────────────

  describe('forceRefresh()', () => {
    it('updates session with fresh tokens', async () => {
      await manager.start();
      const result = await manager.forceRefresh();
      expect(result.session.access_token).toBe('new-at');
      expect(client.auth.refreshSession).toHaveBeenCalled();
    });

    it('throws when refresh token is revoked', async () => {
      client.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'invalid refresh token', status: 401 },
      });
      await manager.start();
      await expect(manager.forceRefresh()).rejects.toThrow(
        'Session could not be refreshed',
      );
      expect(manager.state).toBe(SESSION_STATES.EXPIRED);
    });
  });

  // ── getAccessToken ───────────────────────────────────────────────────

  describe('getAccessToken()', () => {
    it('returns current token when not near expiry', async () => {
      await manager.start();
      const token = await manager.getAccessToken();
      expect(token).toBe('at');
      expect(client.auth.refreshSession).not.toHaveBeenCalled();
    });

    it('refreshes when token is near expiry', async () => {
      client.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'old-at',
            refresh_token: 'rt',
            expires_at: Math.floor(Date.now() / 1000) + 10,
            user: { id: 'u1' },
          },
        },
        error: null,
      });
      await manager.start();
      const token = await manager.getAccessToken(60_000);
      expect(token).toBe('new-at');
    });
  });

  // ── SESSION_STATES ───────────────────────────────────────────────────

  describe('SESSION_STATES', () => {
    it('exposes all expected states', () => {
      expect(SESSION_STATES).toHaveProperty('INITIALIZING');
      expect(SESSION_STATES).toHaveProperty('AUTHENTICATED');
      expect(SESSION_STATES).toHaveProperty('UNAUTHENTICATED');
      expect(SESSION_STATES).toHaveProperty('REFRESHING');
      expect(SESSION_STATES).toHaveProperty('EXPIRED');
      expect(SESSION_STATES).toHaveProperty('ERROR');
    });

    it('is frozen', () => {
      expect(Object.isFrozen(SESSION_STATES)).toBe(true);
    });
  });
});
