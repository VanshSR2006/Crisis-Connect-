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
  zone_id?: string;
  target_zone_id?: string;
  message_en: string;
  message_translated?: Record<string, string>;
  severity?: string;
}): Promise<Alert | null> {
  const zoneId = newAlert.zone_id || newAlert.target_zone_id || 'z-silchar';
  const payload = {
    zone_id: zoneId,
    target_zone_id: zoneId,
    message_en: newAlert.message_en,
    message_translated: newAlert.message_translated,
    severity: newAlert.severity || 'medium',
  };

  try {
    const data = await apiFetch<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data) return data;
  } catch (err) {
    console.warn('[Alerts API] Error posting alert to backend:', err);
  }

  // Fallback for demo / offline / unauthenticated dev mode
  return {
    id: `alt-${Date.now()}`,
    zone_id: zoneId,
    target_zone_id: zoneId,
    title: `EMERGENCY ALERT — ${(payload.severity || 'CRITICAL').toUpperCase()}`,
    message_en: payload.message_en,
    message: payload.message_en,
    message_translated: payload.message_translated || {},
    severity: (payload.severity as any) || 'high',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };
}
