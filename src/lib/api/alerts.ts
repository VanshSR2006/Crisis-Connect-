import { apiFetch } from './client';
import { Alert } from '../../types';
import { mockAlerts } from '../../mocks';

/**
 * GET /alerts – returns list of emergency broadcast alerts from backend.
 * Falls back to mockAlerts if backend is unreachable.
 */
export async function getAlerts(): Promise<Alert[]> {
  const data = await apiFetch<Alert[]>('/alerts');
  return data ?? mockAlerts;
}

/**
 * POST /alerts – creates a new emergency broadcast alert.
 */
export async function createAlert(newAlert: {
  zone_id: string;
  message_en: string;
  message_translated?: Record<string, string>;
  severity?: string;
}): Promise<Alert | null> {
  const data = await apiFetch<Alert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(newAlert),
  });
  return data;
}
