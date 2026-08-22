import { useState, useEffect, useCallback } from 'react';
import {
  getOfflineQueue,
  flushOfflineQueue,
  QueuedSosReport,
  isQueueFlushing,
} from '@/lib/offlineQueue';
import { createIncident } from '@/lib/api/incidents';

import { getStoredUser } from '@/lib/auth';

export interface SyncResult {
  synced: number;
  failed: number;
  timestamp: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const currentUserId = getStoredUser()?.id;
  const [pendingCount, setPendingCount] = useState<number>(() => getOfflineQueue(getStoredUser()?.id).length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshPendingCount = useCallback(() => {
    const userId = getStoredUser()?.id;
    setPendingCount(getOfflineQueue(userId).length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [currentUserId, refreshPendingCount]);

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (isQueueFlushing()) {
      return { synced: 0, failed: 0, timestamp: new Date().toISOString() };
    }

    const userId = getStoredUser()?.id;
    setIsSyncing(true);
    try {
      const result = await flushOfflineQueue(async (report: QueuedSosReport) => {
        const payload = {
          title: report.title || `Emergency ${report.category.toUpperCase()} Request`,
          category: report.category,
          severity: report.severity,
          description: report.description,
          lat: report.lat,
          lng: report.lng,
          zone_id: report.zone_id,
          reporter_id: report.reporter_id || userId,
          photo_base64: report.photo_base64,
          client_id: report.client_id || report.id,
        };

        const res = await createIncident(payload, {
          idempotencyKey: report.client_id || report.id,
        });

        // Backend returns created incident object or non-null on success
        if (res && (res.id || (res as any)._id)) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('sos-report-synced', {
                detail: {
                  clientId: report.client_id || report.id,
                  backendIncident: res,
                },
              })
            );
          }
          return true;
        }
        return false;
      }, userId);

      const syncRes: SyncResult = {
        synced: result.synced,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      };
      setLastSyncResult(syncRes);
      refreshPendingCount();
      return syncRes;
    } catch (err) {
      console.error('[useOfflineSync] Error during sync trigger:', err);
      refreshPendingCount();
      return { synced: 0, failed: 0, timestamp: new Date().toISOString() };
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshPendingCount();
      const userId = getStoredUser()?.id;
      // Auto-trigger sync when connectivity returns for current user
      if (getOfflineQueue(userId).length > 0) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    const handleQueueChanged = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-sos-queue-changed', handleQueueChanged);

    // Initial check: update pending queue count without flushing on page load
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sos-queue-changed', handleQueueChanged);
    };
  }, [refreshPendingCount, triggerSync]);



  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingCount,
  };
}
