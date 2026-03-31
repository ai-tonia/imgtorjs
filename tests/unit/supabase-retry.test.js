import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRetryable,
  sleep,
  backoffDelay,
  withRetry,
  DEFAULT_RETRY_OPTIONS,
} from '../../lib/js/supabase/retry.js';

describe('supabase/retry', () => {
  // ── isRetryable ──────────────────────────────────────────────────────

  describe('isRetryable', () => {
    it('returns false for null/undefined', () => {
      expect(isRetryable(null)).toBe(false);
      expect(isRetryable(undefined)).toBe(false);
    });

    it('recognises retryable HTTP status codes', () => {
      for (const code of [408, 429, 500, 502, 503, 504]) {
        expect(isRetryable({ status: code })).toBe(true);
      }
    });

    it('rejects non-retryable status codes', () => {
      expect(isRetryable({ status: 400 })).toBe(false);
      expect(isRetryable({ status: 401 })).toBe(false);
      expect(isRetryable({ status: 403 })).toBe(false);
      expect(isRetryable({ status: 404 })).toBe(false);
    });

    it('matches network error message substrings', () => {
      expect(isRetryable({ message: 'Failed to fetch' })).toBe(true);
      expect(isRetryable({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true);
      expect(isRetryable({ message: 'ECONNRESET' })).toBe(true);
      expect(isRetryable({ message: 'socket hang up' })).toBe(true);
      expect(isRetryable({ message: 'request timeout exceeded' })).toBe(true);
    });

    it('rejects unrelated error messages', () => {
      expect(isRetryable({ message: 'row not found' })).toBe(false);
      expect(isRetryable({ message: 'JWT expired' })).toBe(false);
    });
  });

  // ── sleep ────────────────────────────────────────────────────────────

  describe('sleep', () => {
    beforeEach(() => { vi.useFakeTimers(); });

    it('resolves after the given duration', async () => {
      const p = sleep(100);
      vi.advanceTimersByTime(100);
      await expect(p).resolves.toBeUndefined();
    });

    it('rejects immediately if signal is already aborted', async () => {
      const ac = new AbortController();
      ac.abort();
      await expect(sleep(100, ac.signal)).rejects.toThrow('Aborted');
    });

    it('rejects when signal is aborted during sleep', async () => {
      vi.useRealTimers();
      const ac = new AbortController();
      const p = sleep(60_000, ac.signal);
      setTimeout(() => ac.abort(), 10);
      await expect(p).rejects.toThrow('Aborted');
    });
  });

  // ── backoffDelay ─────────────────────────────────────────────────────

  describe('backoffDelay', () => {
    it('doubles the base delay for each attempt', () => {
      const opts = { baseDelayMs: 1000, maxDelayMs: 30_000, jitter: false };
      expect(backoffDelay(0, opts)).toBe(1000);
      expect(backoffDelay(1, opts)).toBe(2000);
      expect(backoffDelay(2, opts)).toBe(4000);
      expect(backoffDelay(3, opts)).toBe(8000);
    });

    it('caps at maxDelayMs', () => {
      const opts = { baseDelayMs: 1000, maxDelayMs: 5000, jitter: false };
      expect(backoffDelay(10, opts)).toBe(5000);
    });

    it('adds jitter when enabled', () => {
      const opts = { baseDelayMs: 1000, maxDelayMs: 30_000, jitter: true };
      const delays = new Set();
      for (let i = 0; i < 20; i++) delays.add(backoffDelay(0, opts));
      expect(delays.size).toBeGreaterThan(1);
    });
  });

  // ── withRetry ────────────────────────────────────────────────────────

  describe('withRetry', () => {
    beforeEach(() => { vi.useRealTimers(); });

    it('returns the result on first success', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 42, error: null });
      const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
      expect(result).toEqual({ data: 42, error: null });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable thrown errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ message: 'Failed to fetch' })
        .mockResolvedValue({ data: 'ok', error: null });

      const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
      expect(result).toEqual({ data: 'ok', error: null });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on Supabase-style {error} responses', async () => {
      const fn = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { status: 500, message: 'internal error' } })
        .mockResolvedValue({ data: 'recovered', error: null });

      const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
      expect(result).toEqual({ data: 'recovered', error: null });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('gives up after maxAttempts and returns last error result', async () => {
      const err = { status: 500, message: 'internal error' };
      const fn = vi.fn().mockResolvedValue({ data: null, error: err });

      const result = await withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 });
      expect(result).toEqual({ data: null, error: err });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws non-retryable errors immediately', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('row not found'));
      await expect(
        withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 }),
      ).rejects.toThrow('row not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws AbortError immediately without retrying', async () => {
      const ac = new AbortController();
      ac.abort();
      const fn = vi.fn().mockResolvedValue('ok');
      await expect(
        withRetry(fn, { maxAttempts: 3, signal: ac.signal }),
      ).rejects.toThrow('Aborted');
      expect(fn).not.toHaveBeenCalled();
    });

    it('passes the attempt index to fn', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce({ message: 'Failed to fetch' })
        .mockResolvedValue('ok');

      await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
      expect(fn).toHaveBeenNthCalledWith(1, 0);
      expect(fn).toHaveBeenNthCalledWith(2, 1);
    });
  });

  // ── DEFAULT_RETRY_OPTIONS ────────────────────────────────────────────

  describe('DEFAULT_RETRY_OPTIONS', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_RETRY_OPTIONS)).toBe(true);
    });

    it('has sensible defaults', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxAttempts).toBe(3);
      expect(DEFAULT_RETRY_OPTIONS.baseDelayMs).toBe(1000);
    });
  });
});
