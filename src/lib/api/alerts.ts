import { apiFetch } from './client';
import { Alert } from '../../types';
import { mockAlerts } from '../../mocks';
import { realtimeClient } from './websocket';

const LOCAL_ALERTS_KEY = 'crisis_connect_created_alerts';

function getLocalAlerts(): Alert[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalAlert(alert: Alert): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const existing = getLocalAlerts();
    if (!existing.some((a) => a.id === alert.id)) {
      localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify([alert, ...existing]));
    }
  } catch (e) {}
}

/**
 * GET /alerts – returns list of emergency broadcast alerts from backend or local storage.
 * Falls back to mockAlerts if backend is unreachable.
 */
export async function getAlerts(): Promise<Alert[]> {
  let backendData: Alert[] | null = null;
  try {
    backendData = await apiFetch<Alert[]>('/alerts');
  } catch (e) {
    backendData = null;
  }

  const localAlerts = getLocalAlerts();
  const baseAlerts = backendData && backendData.length > 0 ? backendData : mockAlerts;

  const merged = [...localAlerts];
  baseAlerts.forEach((a) => {
    if (!merged.some((m) => m.id === a.id)) {
      merged.push(a);
    }
  });

  return merged;
}

/**
 * POST /alerts – creates a new emergency broadcast alert.
 * Emits realtime WS event and saves locally for immediate cross-page sync.
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

  let createdAlert: Alert | null = null;

  try {
    const data = await apiFetch<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data) createdAlert = data;
  } catch (err) {
    console.warn('[Alerts API] Error posting alert to backend:', err);
  }

  if (!createdAlert) {
    // Fallback for demo / offline / unauthenticated dev mode
    createdAlert = {
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

  // Persist locally & emit realtime event to update Citizen Homepage & Alert feeds instantly
  saveLocalAlert(createdAlert);
  realtimeClient.emit('alert.created', createdAlert);

  return createdAlert;
}
