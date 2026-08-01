import { apiFetch } from '@/lib/api/client';
import { Incident } from '@/types';
import { mockIncidents } from '@/mocks';

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
 * Returns the created incident (mocked if backend unavailable).
 */
export async function createIncident(newIncident: Omit<Incident, 'id'>): Promise<Incident> {
  const data = await apiFetch<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(newIncident),
  });
  if (data) return data;
  // Mock fallback – generate a temporary ID
  return { ...newIncident, id: `inc-${Date.now()}` } as Incident;
}
