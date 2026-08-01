/**
 * src/lib/api/client.ts
 * Thin wrapper around fetch that adds base URL, auth header, and JSON handling.
 * Returns typed data or null on network error/fallback.
 */

export interface ApiError extends Error {
  status?: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const url = BASE_URL ? `${BASE_URL}${endpoint}` : '';
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
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
    // Network error or backend unreachable – signal fallback by returning null
    console.warn('API fetch failed, falling back to mock data:', e);
    return null;
  }
}
