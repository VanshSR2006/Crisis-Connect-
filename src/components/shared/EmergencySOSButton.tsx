import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Loader2, CheckCircle2, X, Clock } from 'lucide-react';
import { createIncident, buildIncidentPayload } from '@/lib/api/incidents';
import { enqueueSosReport } from '@/lib/offlineQueue';
import { useOfflineSync } from '@/lib/useOfflineSync';
import { generateReferenceId } from '@/lib/generateReferenceId';
import { getStoredUser } from '@/lib/auth';

export const EmergencySOSButton: React.FC = () => {
  const { t } = useTranslation();
  useOfflineSync();

  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'queued'>('idle');
  const [refId, setRefId] = useState<string>('');

  useEffect(() => {
    const handleReportSynced = (e: Event) => {
      const customEvent = e as CustomEvent<{ clientId: string; backendIncident: any }>;
      if (customEvent.detail && refId && customEvent.detail.clientId === refId) {
        setStatus('sent');
      }
    };

    const handleReportSyncFailed = (e: Event) => {
      const customEvent = e as CustomEvent<{ clientId: string }>;
      if (customEvent.detail && refId && customEvent.detail.clientId === refId) {
        setStatus('queued');
      }
    };

    window.addEventListener('sos-report-synced', handleReportSynced);
    window.addEventListener('sos-report-sync-failed', handleReportSyncFailed);
    return () => {
      window.removeEventListener('sos-report-synced', handleReportSynced);
      window.removeEventListener('sos-report-sync-failed', handleReportSyncFailed);
    };
  }, [refId]);

  const triggerSOS = () => {
    setStatus('loading');
    const clientId = generateReferenceId();
    setRefId(clientId);

    // Fallback coordinates (Silchar / Assam flood basin)
    const fallbackLat = 24.8200;
    const fallbackLng = 92.7900;

    const user = getStoredUser();
    const realReporterId = user?.id || 'usr-guest';

    const submitEmergencySOS = async (lat: number, lng: number) => {
      const payload = buildIncidentPayload({
        title: 'Emergency SOS Report',
        description: 'Emergency SOS — panic alert triggered from login page',
        category: 'rescue',
        severity: 'critical',
        lat,
        lng,
        zone_id: (user as any)?.zone_id || 'z-silchar',
        reporter_id: realReporterId,
        client_id: clientId,
      });

      const maxAttempts = 3;
      const baseDelayMs = 1000;
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      if (navigator.onLine) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`[EmergencySOSButton] Attempting online SOS dispatch (attempt ${attempt}/${maxAttempts})...`);

            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : null;

            const res = await createIncident(payload, {
              idempotencyKey: clientId,
              ...(controller ? { signal: controller.signal } : {}),
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (res && (res.id || (res as any)._id)) {
              console.log(`[EmergencySOSButton] SOS successfully delivered to backend on attempt ${attempt}`);
              setStatus('sent');
              return;
            }
          } catch (err) {
            console.warn(`[EmergencySOSButton] Attempt ${attempt}/${maxAttempts} failed:`, err);
          }

          // If attempt failed and device is still online, wait briefly with backoff before next retry
          if (attempt < maxAttempts && navigator.onLine) {
            const backoffMs = baseDelayMs * Math.pow(2, attempt - 1);
            console.log(`[EmergencySOSButton] Weak/unstable network detected. Retrying in ${backoffMs}ms...`);
            await sleep(backoffMs);
          }
        }
      }

      // If offline or POST /incidents failed after all retries, push into existing offline queue
      console.warn('[EmergencySOSButton] All online attempts failed or device offline. Enqueueing to offline queue.');
      enqueueSosReport(
        {
          id: clientId,
          client_id: clientId,
          title: payload.title,
          category: payload.category,
          severity: payload.severity,
          description: payload.description,
          lat,
          lng,
          zone_id: payload.zone_id,
          reporter_id: realReporterId,
        },
        realReporterId
      );
      setStatus('queued');
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          submitEmergencySOS(position.coords.latitude, position.coords.longitude);
        },
        () => {
          submitEmergencySOS(fallbackLat, fallbackLng);
        },
        { timeout: 5000 }
      );
    } else {
      submitEmergencySOS(fallbackLat, fallbackLng);
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2.5 shadow-sm">
        <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
        <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
          Sending location...
        </span>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-md relative animate-fadeIn">
        <button
          onClick={() => setStatus('idle')}
          className="absolute top-3 right-3 text-emerald-600 hover:text-emerald-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              {t('guestSos.distressLogged', 'Sent')}
            </h4>
            <p className="text-[12px] text-emerald-800 leading-relaxed font-semibold">
              {t('guestSos.reassuranceMessage', 'Emergency distress signal sent to emergency responders.')}
            </p>
            <div className="pt-1.5 flex items-center gap-1.5 text-xs text-emerald-950">
              <span className="font-medium">{t('guestSos.referenceId', 'Ref ID')}:</span>
              <strong className="font-mono bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 shadow-xs font-black">
                {refId}
              </strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'queued') {
    return (
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-md relative animate-fadeIn">
        <button
          onClick={() => setStatus('idle')}
          className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-600 text-white rounded-lg shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
              Queued — will send when connected
            </h4>
            <p className="text-[12px] text-amber-800 leading-relaxed font-semibold">
              Your emergency location is saved offline and will automatically dispatch as soon as network returns.
            </p>
            <div className="pt-1.5 flex items-center gap-1.5 text-xs text-amber-950">
              <span className="font-medium">Ref ID:</span>
              <strong className="font-mono bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 shadow-xs font-black">
                {refId}
              </strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={triggerSOS}
      className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.99] hover:scale-[1.01] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200/80 border border-red-500 flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer animate-pulse"
      style={{ animationDuration: '3s' }}
    >
      <ShieldAlert className="h-4.5 w-4.5" />
      <span>{t('guestSos.buttonLabel', 'Emergency SOS (Distress Panic Alert)')}</span>
    </button>
  );
};
