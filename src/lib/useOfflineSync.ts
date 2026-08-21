import { useState, useEffect, useCallback } from 'react';
import {
  getOfflineQueue,
  flushOfflineQueue,
  QueuedSosReport,
  isQueueFlushing,
} from '@/lib/offlineQueue';
import { createIncident } from '@/lib/api/incidents';

export interface SyncResult {
  synced: number;
  failed: number;
  timestamp: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getOfflineQueue().length);
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    if (isQueueFlushing()) {
      return { synced: 0, failed: 0, timestamp: new Date().toISOString() };
    }

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
          reporter_id: report.reporter_id,
          photo_base64: report.photo_base64,
          client_id: report.client_id || report.id,
        };

        const res = await createIncident(payload, {
          idempotencyKey: report.client_id || report.id,
        });

        // Backend returns created incident object or non-null on success
        return res !== null;
      });

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
      // Auto-trigger sync when connectivity returns
      if (getOfflineQueue().length > 0) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshPendingCount();
    if (navigator.onLine && getOfflineQueue().length > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
