/**
 * src/lib/auth.ts
 * Thin auth utility — mirrors the backend UserResponse schema.
 * Used by RequireAuth guard and apiFetch error handler.
 * DO NOT import heavy dependencies here; this module is loaded on every route.
 */

import type { UserRole } from '@/types';

/** Mirrors backend LoginResponse.user (UserResponse Pydantic model) */
export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  language_pref?: string;
}

/**
 * Returns the authenticated user stored in localStorage, or null if absent/invalid.
 * Reads the `user` key set by Login.tsx after a successful /auth/login response.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    // Validate minimum required fields
    if (!parsed.id || !parsed.role) return null;
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Returns the raw JWT token from localStorage, or null.
 */
export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Clears all auth state from localStorage.
 * Called on logout or when a 401/403 is received from the backend.
 */
export function clearAuth(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
