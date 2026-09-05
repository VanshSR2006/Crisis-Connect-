import { apiFetch } from '@/lib/api/client';
import { Incident, IncidentStatus, IncidentCategory, VulnerabilityContext } from '@/types';

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

export interface IncidentPayloadOptions {
  title?: string;
  category: IncidentCategory | string;
  severity?: string;
  description: string;
  lat: number;
  lng: number;
  locationName?: string;
  zone_id?: string;
  reporter_id?: string;
  photo_base64?: string;
  client_id?: string;
  vulnerability_context?: VulnerabilityContext;
}

export function buildIncidentPayload(options: IncidentPayloadOptions): Record<string, any> {
  const zoneId =
    options.zone_id && typeof options.zone_id === 'string' && options.zone_id.trim() !== ''
      ? options.zone_id
      : 'z-silchar';

  let reporterId = options.reporter_id;
  if (!reporterId || reporterId === 'usr-citizen-1' || reporterId === 'guest' || reporterId === 'usr-guest') {
    reporterId = 'usr-guest';
  }

  return {
    title: options.title || `Emergency ${String(options.category).toUpperCase()} Request`,
    category: options.category,
    severity: options.severity || 'critical',
    description: options.description,
    lat: options.lat,
    lng: options.lng,
    location: {
      lat: options.lat,
      lng: options.lng,
      address: options.locationName || 'Emergency SOS Location',
      type: 'Point',
      coordinates: [options.lng, options.lat],
    },
    zone_id: zoneId,
    reporter_id: reporterId,
    photo_base64: options.photo_base64,
    client_id: options.client_id,
    vulnerability_context: options.vulnerability_context,
  };
}

/**
 * POST /incidents – creates a new incident.
 * Accepts optional idempotencyKey for duplicate protection across retries/flushes.
 * Returns the created incident from backend, or null if backend call failed.
 */
export async function createIncident(
  newIncident: Omit<Incident, 'id'> | Record<string, any>,
  options?: { idempotencyKey?: string; signal?: AbortSignal }
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

    if (!payload.reporter_id || payload.reporter_id === 'usr-citizen-1' || payload.reporter_id === 'guest') {
      payload.reporter_id = 'usr-guest';
    }

    if (!payload.zone_id || typeof payload.zone_id !== 'string' || payload.zone_id.trim() === '') {
      payload.zone_id = 'z-silchar';
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
      ...(options?.signal ? { signal: options.signal } : {}),
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
