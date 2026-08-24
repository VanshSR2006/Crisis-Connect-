import { apiFetch } from '@/lib/api/client';
import { Incident, IncidentStatus } from '@/types';

/**
 * GET /incidents – returns a list of incidents.
 * Throws error if backend is unreachable (no mock fallback).
 */
export async function getIncidents(): Promise<Incident[]> {
  const data = await apiFetch<Incident[]>('/incidents');

  if (!data) {
    throw new Error('Unable to load incidents');
  }

  return data;
}

/**
 * POST /incidents – creates a new incident.
 * Accepts optional idempotencyKey for duplicate protection across retries/flushes.
 * Returns the created incident from backend, or null if backend call failed.
 */
export async function createIncident(
  newIncident: Omit<Incident, 'id'> | Record<string, any>,
  options?: { idempotencyKey?: string }
): Promise<Incident | null> {
  try {
    const payload = { ...newIncident };

    // Derive reporter_id from stored user session if not explicitly provided in payload.
    if (!payload.reporter_id && typeof localStorage !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          const parsed = JSON.parse(storedUser);

          if (parsed && parsed.id) {
            payload.reporter_id = parsed.id;
          }
        }
      } catch {
        // Ignore localStorage/JSON parse errors.
      }
    }

    const idempotencyKey =
      options?.idempotencyKey ||
      (payload as any).client_id ||
      (payload as any).id;

    const data = await apiFetch<Incident>('/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey
          ? { 'Idempotency-Key': idempotencyKey }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    return data;
  } catch (err) {
    console.warn(
      'Backend 500 hit, falling back to local generated incident response:',
      err
    );

    // Offline queue logic is handled at the component level.
    return null;
  }
}

/** Persist an officer status transition on the canonical incident record. */
export async function updateIncidentStatus(
  id: string,
  status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
): Promise<Incident | null> {
  return apiFetch<Incident>(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
