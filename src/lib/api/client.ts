// TEAM OWNERSHIP: MEMBER 3 — BACKEND + DATABASE + SECURITY + REALTIME
// Base API client. All frontend API calls must go through apiFetch().

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
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined) ||
  (envApiUrl && envApiUrl.trim() !== ''
    ? envApiUrl
    : isLocalhost
    ? 'http://localhost:8000'
    : 'https://crisis-connect-api-dev.onrender.com');

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const baseUrlClean = (BASE_URL || '').replace(/\/+$/, '');
  const endpointClean = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = baseUrlClean
    ? `${baseUrlClean}${endpointClean}`
    : endpointClean;

  const token = getStoredToken();

  const isFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(!isFormData && {
      'Content-Type': 'application/json',
    }),
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    ...(options.headers ?? {}),
  };

  try {
    console.log(
      '[API] Request:',
      options.method || 'GET',
      url
    );

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType =
      response.headers.get('content-type') || '';

    let data: any = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { detail: text } : null;
    }

    console.log(
      '[API] Response:',
      response.status,
      url
    );

    if (!response.ok) {
      const detail =
        data?.detail ||
        `Request failed with status ${response.status}`;

      const error = new Error(
        typeof detail === 'string'
          ? detail
          : JSON.stringify(detail)
      ) as ApiError;

      error.status = response.status;

      // Only clear an existing session when an authenticated
      // request receives a 401.
      if (response.status === 401 && token) {
        console.warn(
          `[apiFetch] Authentication expired/invalid on ${endpoint}`
        );

        clearAuth();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw error;
    }

    return data as T;
  } catch (error) {
    const apiError = error as ApiError;

    // Preserve HTTP errors such as 401, 403 and 422.
    if (apiError.status) {
      throw apiError;
    }

    console.error(
      '[API] Network error:',
      url,
      error
    );

    throw new Error(
      'Unable to connect to the Crisis Connect API.'
    );
  }
}