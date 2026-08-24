import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/client';
import { getStoredSession, storeAuth } from '@/lib/auth';

const fetchMock = vi.fn();

describe('apiFetch authentication handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    storeAuth({ token: 'valid-jwt', user: { id: 'volunteer-1', name: 'Volunteer', role: 'volunteer' } });
  });

  it('sends the persisted JWT as a Bearer token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'dispatch-1' }) });

    await apiFetch('/dispatches');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/dispatches'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid-jwt' }) })
    );
  });

  it('clears the session on a 401', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await apiFetch('/protected');

    expect(getStoredSession()).toBeNull();
  });

  it.each([403, 500])('keeps the session on HTTP %i', async (status) => {
    fetchMock.mockResolvedValue({ ok: false, status });

    await apiFetch('/protected');

    expect(getStoredSession()).not.toBeNull();
  });

  it('keeps the session on a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network unavailable'));

    await apiFetch('/protected');

    expect(getStoredSession()).not.toBeNull();
  });
});
