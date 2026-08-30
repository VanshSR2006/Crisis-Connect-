// TEAM OWNERSHIP: MEMBER 3 — BACKEND + DATABASE + SECURITY + REALTIME
// Base API client. All frontend API calls must go through apiFetch().
// Coordinate before modifying outside this workstream.

/**
 * src/lib/api/client.ts
 * Thin wrapper around fetch that adds base URL, auth header, and JSON handling.
 * Returns typed data or null on network error/fallback.
 * Only a 401 authentication failure clears stored auth and redirects to /login.
 */

import { clearAuth, getStoredToken } from '@/lib/auth';

export interface ApiError extends Error {
  status?: number;
}

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envApiUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;

const BASE_URL =
  envApiUrl && envApiUrl.trim() !== ''
    ? envApiUrl
    : isLocalhost
    ? 'http://localhost:8000'
    : 'https://crisis-connect-api-dev.onrender.com';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const baseUrlClean = (BASE_URL || '').replace(/\/+$/, '');
  const endpointClean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = baseUrlClean ? `${baseUrlClean}${endpointClean}` : endpointClean;
  const token = getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers ?? {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const error: ApiError = new Error(`API error ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const data = (await response.json()) as T;
    return data;
  } catch (e) {
    const apiErr = e as ApiError;
    // Auth errors: clear stored credentials and force re-login
    if (apiErr.status === 401) {
      console.warn(`[apiFetch] Auth error ${apiErr.status} on ${endpoint} — clearing session.`);
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    // Network error or backend unreachable – return null so caller handles error
    console.warn(`API fetch failed [${url}]:`, e);
    return null;
  }
}
