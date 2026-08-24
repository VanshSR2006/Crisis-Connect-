import { describe, expect, it } from 'vitest';
import { clearAuth, getStoredSession, storeAuth } from '@/lib/auth';

describe('persisted authentication session', () => {
  it.each(['citizen', 'officer', 'volunteer'] as const)(
    'stores and restores the %s role without changing it',
    (role) => {
      storeAuth({
        token: `${role}-jwt`,
        user: { id: `${role}-id`, name: `${role} user`, role },
      });

      expect(getStoredSession()).toEqual({
        token: `${role}-jwt`,
        user: { id: `${role}-id`, name: `${role} user`, role },
      });
    }
  );

  it('clears the session on explicit logout', () => {
    storeAuth({ token: 'jwt', user: { id: '1', name: 'Citizen', role: 'citizen' } });

    clearAuth();

    expect(getStoredSession()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
