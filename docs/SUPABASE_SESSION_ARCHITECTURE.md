# Supabase Session Architecture

Complete overhaul of Supabase session management, aligned with 2025-2026 best
practices.  Solves the recurring issue of projects and images failing to load
after periods of inactivity.

## Root cause analysis

Three failure modes cause data to stop loading:

| # | Failure | What happens | Old behaviour |
|---|---------|--------------|---------------|
| 1 | **Tab goes to background** | Browser throttles timers; SDK's auto-refresh interval may be skipped | Token expires silently; next fetch gets 401; UI shows empty state |
| 2 | **Proactive refresh fails** | Network blip during the ≈90 s pre-expiry refresh window | SDK silently drops session (fixed partially in supabase-js 2.x March 2026) |
| 3 | **Long inactivity (device sleep)** | Access token expires; stored refresh token may also be revoked | No recovery path; user sees broken state without auth prompt |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Application UI                       │
│                                                          │
│   query(sb => sb.from('projects').select('*'))            │
│          ↓                                               │
│   ┌──────────────┐     ┌─────────────────────────────┐   │
│   │  query.js    │────▶│  retry.js (withRetry)        │   │
│   │  selectFrom  │     │  exponential backoff + jitter│   │
│   └──────┬───────┘     └─────────────────────────────┘   │
│          │ 401? → refresh + retry                        │
│          ▼                                               │
│   ┌──────────────┐                                       │
│   │  client.js   │  singleton, configured once            │
│   │  (Supabase)  │  PKCE flow, auto-refresh, persist     │
│   └──────┬───────┘                                       │
│          │                                               │
│          ▼                                               │
│   ┌──────────────────────────────────────────────────┐   │
│   │              session.js (SessionManager)          │   │
│   │                                                  │   │
│   │  • onAuthStateChange subscription                │   │
│   │  • visibilitychange → immediate token refresh    │   │
│   │  • online event     → immediate token refresh    │   │
│   │  • periodic health check (60 s)                  │   │
│   │  • forceRefresh() for critical paths             │   │
│   │  • state machine: INIT → AUTH / UNAUTH / REFRESH │   │
│   └──────────────────────────────────────────────────┘   │
│          │                                               │
│          ▼                                               │
│   ┌──────────────┐                                       │
│   │  auth.js     │  sign-in, sign-up, sign-out, etc.     │
│   │  (helpers)   │  each wrapped with retry              │
│   └──────────────┘                                       │
└──────────────────────────────────────────────────────────┘
```

## Modules

### `client.js` — Singleton Supabase client

```js
import { configure, getClient } from './supabase/index.js';

configure({
  url: 'https://xxx.supabase.co',
  anonKey: 'eyJ...',
});

const supabase = getClient();
```

Key auth options (set automatically):

| Option | Value | Why |
|--------|-------|-----|
| `persistSession` | `true` | Survive page reloads |
| `autoRefreshToken` | `true` | SDK proactively refreshes ~90 s before expiry |
| `detectSessionInUrl` | `true` | Handle OAuth/magic-link callback tokens |
| `flowType` | `'pkce'` | Most secure; recommended for all new apps |

### `session.js` — SessionManager

The core of the overhaul.  Manages the full lifecycle:

```js
import { SessionManager, getClient, SESSION_STATES } from './supabase/index.js';

const manager = new SessionManager({
  client: getClient(),
  onStateChange(state, detail) {
    console.log(state, detail);
    if (state === SESSION_STATES.EXPIRED) {
      window.location.href = '/login?expired=1';
    }
  },
});

await manager.start();
```

**State machine:**

```
INITIALIZING ──▶ AUTHENTICATED
                    │    ▲
                    ▼    │
               REFRESHING
                    │
             ┌─────┴─────┐
             ▼            ▼
          EXPIRED       ERROR

INITIALIZING ──▶ UNAUTHENTICATED
```

**Visibility recovery:**  When `document.visibilityState` changes to
`'visible'`, the manager immediately tries `refreshSession()` with retry.
This catches the most common cause of stale tokens: user switches back to a
tab that has been asleep.

**Online recovery:**  Same pattern on the `window.online` event.

**Periodic health check:**  Every 60 s (configurable), verifies the session is
still valid.  Catches edge cases where neither visibility nor online events
fire (e.g. long-running desktop PWAs).

### `retry.js` — Exponential backoff

```js
import { withRetry } from './supabase/index.js';

const result = await withRetry(
  () => supabase.from('pictures').select('*'),
  { maxAttempts: 3, baseDelayMs: 1000 }
);
```

- Recognises retryable HTTP status codes: 408, 429, 500, 502, 503, 504
- Recognises common network error strings (Failed to fetch, timeout, etc.)
- Jittered backoff to avoid thundering herd
- `AbortSignal` support for cancellation

### `query.js` — Session-aware data fetching

```js
import { query, selectFrom } from './supabase/index.js';

// Full control
const { data, error } = await query(sb =>
  sb.from('projects').select('*, pictures(*)').eq('user_id', userId)
);

// Shorthand
const { data: pics } = await selectFrom('pictures', '*', {
  filters: { project_id: projectId },
  limit: 50,
});
```

On a 401 response, `query()` transparently refreshes the session and retries
the request once before surfacing the error.  This is the key fix for
"pictures stop loading" — previously a single stale-token 401 would
permanently break the data layer until a hard reload.

### `auth.js` — Auth operation wrappers

All sign-in/sign-up/sign-out methods are pre-wrapped with `withRetry` so
transient network errors during authentication don't strand the user.

## Migration guide

1. **Replace direct `createClient` calls** with `configure()` + `getClient()`.
2. **Instantiate `SessionManager`** early in app startup (e.g. in your root
   layout or `main.js`).
3. **Replace bare `supabase.from(…)` calls** with `query(…)` or
   `selectFrom(…)` for automatic retry and token refresh.
4. **Handle `SESSION_STATES.EXPIRED`** in your `onStateChange` callback to
   redirect to login.
5. **Remove any custom retry/refresh logic** — it's now built into the
   architecture.

## Configuration reference

### SessionManager options

| Option | Default | Description |
|--------|---------|-------------|
| `client` | *required* | Supabase client instance |
| `onStateChange` | no-op | `(state, detail) => void` callback |
| `healthCheckIntervalMs` | `60000` | Periodic session validation interval |
| `refreshRetryMaxAttempts` | `4` | Max retries for token refresh |
| `enableVisibilityHandling` | `true` | Listen to `visibilitychange` |
| `enablePeriodicHealthCheck` | `true` | Enable the 60 s liveness probe |

### Retry options

| Option | Default | Description |
|--------|---------|-------------|
| `maxAttempts` | `3` | Total attempts (1 initial + N-1 retries) |
| `baseDelayMs` | `1000` | Delay before first retry |
| `maxDelayMs` | `30000` | Cap on backoff |
| `jitter` | `true` | Randomise delay ±50 % |
| `retryIf` | `isRetryable` | Predicate to decide if error is retryable |
| `signal` | — | `AbortSignal` for cancellation |
