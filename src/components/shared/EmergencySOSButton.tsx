import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Loader2, CheckCircle2, X } from 'lucide-react';
import { createIncident } from '@/lib/api/incidents';
import { enqueueSosReport } from '@/lib/offlineQueue';
import { mockIncidents } from '@/mocks/incidents';
import { generateReferenceId } from '@/lib/generateReferenceId';
import { Incident } from '@/types';

export const EmergencySOSButton: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirmed'>('idle');
  const [refId, setRefId] = useState<string>('');

  const triggerSOS = () => {
    setStatus('loading');
    const generatedId = generateReferenceId();

    // Fallback coordinates (Silchar / Assam flood basin)
    const fallbackLat = 24.8200;
    const fallbackLng = 92.7900;

    const createAndPushIncident = async (lat: number, lng: number) => {
      const payload = {
        title: 'GUEST PANIC ALERT',
        description: 'Emergency SOS — guest panic alert triggered',
        category: 'rescue',
        severity: 'critical',
        lat,
        lng,
        zone_id: 'z-silchar',
        reporter_id: 'usr-guest',
      };

      if (navigator.onLine) {
        const res = await createIncident(payload);
        if (res && res.id) {
          setRefId(res.id);
        } else {
          setRefId(generatedId);
        }
      } else {
        enqueueSosReport({
          id: generatedId,
          client_id: generatedId,
          title: payload.title,
          category: payload.category as any,
          severity: payload.severity as any,
          description: payload.description,
          lat,
          lng,
          zone_id: payload.zone_id,
          reporter_id: payload.reporter_id,
        });
        setRefId(generatedId);
      }
      setStatus('confirmed');
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createAndPushIncident(position.coords.latitude, position.coords.longitude);
        },
        () => {
          createAndPushIncident(fallbackLat, fallbackLng);
        },
        { timeout: 5000 }
      );
    } else {
      createAndPushIncident(fallbackLat, fallbackLng);
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2.5 shadow-sm">
        <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
        <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
          {t('guestSos.sendingSignal')}
        </span>
      </div>
    );
  }

  if (status === 'confirmed') {
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
              {t('guestSos.distressLogged')}
            </h4>
            <p className="text-[12px] text-emerald-800 leading-relaxed font-semibold">
              {t('guestSos.reassuranceMessage')}
            </p>
            <div className="pt-1.5 flex items-center gap-1.5 text-xs text-emerald-950">
              <span className="font-medium">{t('guestSos.referenceId')}:</span>
              <strong className="font-mono bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 shadow-xs font-black">
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
      <span>{t('guestSos.buttonLabel')}</span>
    </button>
  );
};
