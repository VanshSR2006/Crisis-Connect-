import { apiFetch } from './client';
import { Incident } from '../../types';
import { mockIncidents } from '../../mocks';

/**
 * GET /incidents – returns a list of incidents.
 * Falls back to mockIncidents when the backend is unreachable.
 */
export async function getIncidents(): Promise<Incident[]> {
  const data = await apiFetch<Incident[]>('/incidents');
  return data ?? mockIncidents;
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
    const idempotencyKey = options?.idempotencyKey || (newIncident as any).client_id || (newIncident as any).id;
    const data = await apiFetch<Incident>('/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(newIncident),
    });
    return data;
  } catch (err) {
    console.warn("Backend 500 hit, falling back to local generated incident response:", err);
    // Offline queue logic component level par trigger ho jayegi
    return null;
  }
}