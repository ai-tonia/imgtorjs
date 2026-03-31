import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}));

import { createClient } from '@supabase/supabase-js';

describe('supabase/client', () => {
  let mod;

  beforeEach(async () => {
    vi.resetModules();
    vi.mocked(createClient).mockClear();
    mod = await import('../../lib/js/supabase/client.js');
    mod.resetClient();
  });

  describe('configure()', () => {
    it('throws when called without url or anonKey', () => {
      expect(() => mod.configure({})).toThrow('requires { url, anonKey }');
      expect(() => mod.configure({ url: 'x' })).toThrow('requires { url, anonKey }');
    });

    it('throws when called twice with different credentials', () => {
      mod.configure({ url: 'a', anonKey: 'b' });
      expect(() => mod.configure({ url: 'c', anonKey: 'd' })).toThrow(
        'called twice with different credentials',
      );
    });

    it('allows calling with same credentials (idempotent)', () => {
      mod.configure({ url: 'a', anonKey: 'b' });
      expect(() => mod.configure({ url: 'a', anonKey: 'b' })).not.toThrow();
    });
  });

  describe('getClient()', () => {
    it('throws when called before configure()', () => {
      expect(() => mod.getClient()).toThrow('call configure');
    });

    it('creates a supabase client with correct auth options', () => {
      mod.configure({ url: 'https://x.supabase.co', anonKey: 'key' });
      const client = mod.getClient();

      expect(createClient).toHaveBeenCalledWith(
        'https://x.supabase.co',
        'key',
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          }),
        }),
      );
      expect(client).toBeTruthy();
    });

    it('returns the same instance on repeated calls', () => {
      mod.configure({ url: 'https://x.supabase.co', anonKey: 'key' });
      const a = mod.getClient();
      const b = mod.getClient();
      expect(a).toBe(b);
      expect(createClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetClient()', () => {
    it('allows reconfiguration after reset', () => {
      mod.configure({ url: 'a', anonKey: 'b' });
      mod.getClient();
      mod.resetClient();
      mod.configure({ url: 'c', anonKey: 'd' });
      mod.getClient();
      expect(createClient).toHaveBeenCalledTimes(2);
    });
  });
});
