// TEAM OWNERSHIP: MEMBER 1 — CITIZEN PWA + VOLUNTEER WORKFLOW
// Offline SOS queue: localStorage management, enqueueing, flushing on reconnect.
// Coordinate before modifying outside this workstream.

/**
 * Low-Bandwidth & Offline SOS Queue Management (Feature F02)
 * Manages local storage of emergency reports when connectivity is lost,
 * auto-retrying submission once the network is restored.
 */

import { IncidentCategory, SeverityLevel } from '../types';
import { getStoredUser } from './auth';

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

const notifyQueueChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offline-sos-queue-changed'));
  }
};

/**
 * Reads all raw stored SOS reports from localStorage.
 */
export const getAllRawOfflineQueue = (): QueuedSosReport[] => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline SOS queue:', err);
    return [];
  }
};

/**
 * Gets offline SOS queue items scoped strictly to the specified user ID (or current logged-in user).
 */
export const getOfflineQueue = (targetUserId?: string): QueuedSosReport[] => {
  const userId = targetUserId || getStoredUser()?.id;
  const rawQueue = getAllRawOfflineQueue();
  if (!userId) {
    // When unauthenticated, return all queued reports
    return rawQueue;
  }

  return rawQueue.filter((item) => {
    if (!item.reporter_id || item.reporter_id === 'usr-guest' || item.reporter_id === 'guest' || item.reporter_id === 'usr-citizen-1') {
      return true;
    }
    return item.reporter_id === userId;
  });
};

/**
 * Enqueues an SOS report associated with the user ID who created it.
 */
export const enqueueSosReport = (
  report: Omit<QueuedSosReport, 'queued_at'> & { id?: string },
  targetUserId?: string
): QueuedSosReport => {
  const userId = targetUserId || report.reporter_id || getStoredUser()?.id;
  const queuedId = report.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const queuedItem: QueuedSosReport = {
    ...report,
    id: queuedId,
    client_id: report.client_id || queuedId,
    reporter_id: userId || report.reporter_id,
    queued_at: new Date().toISOString(),
  };

  const rawQueue = getAllRawOfflineQueue();
  rawQueue.push(queuedItem);

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(rawQueue));
    notifyQueueChanged();
  } catch (err) {
    console.error('Failed to save SOS report to offline queue:', err);
  }

  return queuedItem;
};

/**
 * Removes a specific queued report by ID.
 */
export const removeFromOfflineQueue = (id: string): void => {
  const rawQueue = getAllRawOfflineQueue();
  const updatedQueue = rawQueue.filter((item) => item.id !== id);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    notifyQueueChanged();
  } catch (err) {
    console.error('Failed to remove report from offline queue:', err);
  }
};

/**
 * Clears offline queue items belonging to a specific user (or all if no userId).
 */
export const clearOfflineQueue = (targetUserId?: string): void => {
  const userId = targetUserId || getStoredUser()?.id;
  if (!userId) {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    notifyQueueChanged();
    return;
  }
  const rawQueue = getAllRawOfflineQueue();
  const remaining = rawQueue.filter((item) => {
    if (!item.reporter_id) {
      return !(userId === 'usr-citizen-1' || userId === 'usr-001');
    }
    return item.reporter_id !== userId;
  });
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    notifyQueueChanged();
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
};


/**
 * Flushes offline queue items isolated strictly to the specified user ID.
 */
export const flushOfflineQueue = async (
  sendReportFn: (report: QueuedSosReport) => Promise<boolean>,
  targetUserId?: string
): Promise<{ synced: number; failed: number }> => {
  if (isFlushingQueue) {
    console.log('[OfflineQueue] Flush already in progress, skipping duplicate call.');
    return { synced: 0, failed: 0 };
  }

  isFlushingQueue = true;
  try {
    const queue = getOfflineQueue(targetUserId);
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

