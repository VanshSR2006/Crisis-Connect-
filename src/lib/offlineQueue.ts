// TEAM OWNERSHIP: MEMBER 1 — CITIZEN PWA + VOLUNTEER WORKFLOW
// Offline SOS queue: localStorage management, enqueueing, flushing on reconnect.
// Coordinate before modifying outside this workstream.

/**
 * Low-Bandwidth & Offline SOS Queue Management (Feature F02)
 * Manages local storage of emergency reports when connectivity is lost,
 * auto-retrying submission once the network is restored.
 */

import { IncidentCategory, SeverityLevel } from '../types';

export interface QueuedSosReport {
  id: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  description: string;
  lat: number;
  lng: number;
  reporter_id?: string;
  zone_id: string;
  queued_at: string;
  photo_base64?: string;
  title?: string;
  client_id?: string;
}

const QUEUE_STORAGE_KEY = 'crisis_connect_offline_sos_queue';

let isFlushingQueue = false;

export const isQueueFlushing = (): boolean => isFlushingQueue;

export const getOfflineQueue = (): QueuedSosReport[] => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline SOS queue:', err);
    return [];
  }
};

export const enqueueSosReport = (
  report: Omit<QueuedSosReport, 'queued_at'> & { id?: string }
): QueuedSosReport => {
  const queuedId = report.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const queuedItem: QueuedSosReport = {
    ...report,
    id: queuedId,
    client_id: report.client_id || queuedId,
    queued_at: new Date().toISOString(),
  };

  const currentQueue = getOfflineQueue();
  currentQueue.push(queuedItem);

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(currentQueue));
  } catch (err) {
    console.error('Failed to save SOS report to offline queue:', err);
  }

  return queuedItem;
};

export const removeFromOfflineQueue = (id: string): void => {
  const currentQueue = getOfflineQueue();
  const updatedQueue = currentQueue.filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
};

export const clearOfflineQueue = (): void => {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
};

export const flushOfflineQueue = async (
  sendReportFn: (report: QueuedSosReport) => Promise<boolean>
): Promise<{ synced: number; failed: number }> => {
  if (isFlushingQueue) {
    console.log('[OfflineQueue] Flush already in progress, skipping duplicate call.');
    return { synced: 0, failed: 0 };
  }

  isFlushingQueue = true;
  try {
    const queue = getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const report of queue) {
      try {
        const success = await sendReportFn(report);
        if (success) {
          removeFromOfflineQueue(report.id);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to flush queued SOS report ${report.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  } finally {
    isFlushingQueue = false;
  }
};
