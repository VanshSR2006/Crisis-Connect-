import { apiFetch } from '@/lib/api/client';
import { Incident } from '@/types';

/**
 * GET /incidents – returns a list of incidents.
 * Throws error if backend is unreachable (no mock fallback).
 */
export async function getIncidents(): Promise<Incident[]> {
  const data = await apiFetch<Incident[]>('/incidents');
  if (!data) throw new Error('Unable to load incidents');
  return data;
}

/**
 * POST /incidents – creates a new incident.
 * Returns the created incident.
 */
export async function createIncident(newIncident: Omit<Incident, 'id'>): Promise<Incident> {
  const data = await apiFetch<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(newIncident),
  });
  if (!data) throw new Error('Unable to create incident');
  return data;
}
