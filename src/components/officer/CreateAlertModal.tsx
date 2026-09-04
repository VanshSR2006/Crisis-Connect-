import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createAlert } from '@/lib/api/alerts';
import { generateMultilingualAlertPayload } from '@/lib/translation';
import { mockZones } from '@/mocks/zones';
import { SeverityLevel } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  ShieldAlert,
} from 'lucide-react';

import { getZones, ZoneResponse } from '@/lib/api/zones';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated?: () => void;
  onCreated?: () => void;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onAlertCreated,
  onCreated,
}) => {
  const { t } = useTranslation();

  const [zonesList, setZonesList] = useState<{ id: string; name: string }[]>([]);
  const [targetZoneId, setTargetZoneId] = useState<string>('z-silchar');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [messageEn, setMessageEn] = useState<string>('');
  
  const [translatedHi, setTranslatedHi] = useState<string>('');
  const [translatedKa, setTranslatedKa] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadZones() {
      try {
        const fetched = await getZones();
        if (fetched && fetched.length > 0) {
          const list = fetched.map((z) => ({
            id: z.id,
            name: `${z.name}${z.district ? ` (${z.district})` : ''}`,
          }));
          setZonesList(list);
          setTargetZoneId(list[0].id);
          return;
        }
      } catch (err) {
        console.warn('[CreateAlertModal] Could not fetch backend zones, using defaults:', err);
      }
      const fallbackList = [
        { id: 'z-silchar', name: 'Silchar Urban Sector 4 (z-silchar)' },
        ...mockZones.map((z) => ({ id: z.id, name: z.name })),
      ];
      setZonesList(fallbackList);
      setTargetZoneId(fallbackList[0].id);
    }
    loadZones();
  }, []);

  useEffect(() => {
    if (messageEn.trim()) {
      const payload = generateMultilingualAlertPayload(messageEn);
      setTranslatedHi(payload.hi);
      setTranslatedKa(payload.ka);
    } else {
      setTranslatedHi('');
      setTranslatedKa('');
    }
  }, [messageEn]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageEn.trim()) {
      setErrorMsg('Please enter an English alert message.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = generateMultilingualAlertPayload(messageEn);
      const finalHi = translatedHi.trim() || payload.hi || messageEn.trim();
      const finalKa = translatedKa.trim() || payload.ka || messageEn.trim();

      const created = await createAlert({
        zone_id: targetZoneId,
        target_zone_id: targetZoneId,
        severity,
        message_en: messageEn.trim(),
        message_translated: {
          hi: finalHi,
          ka: finalKa,
          kn: finalKa,
          en: messageEn.trim(),
        },
      });

      if (created) {
        setIsSuccess(true);
        if (onAlertCreated) onAlertCreated();
        if (onCreated) onCreated();
        setTimeout(() => {
          setIsSuccess(false);
          setMessageEn('');
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Failed to issue broadcast alert. Check server log.');
      }
    } catch (err: any) {
      console.error('[CreateAlertModal] Submission error:', err);
      setErrorMsg(err.message || 'Network error broadcasting alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl max-w-xl w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-0">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-500/20 rounded-lg border border-red-500/40">
              <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Issue Emergency Broadcast Alert
              </h2>
              <p className="text-[10px] text-slate-300 font-semibold">
                Multilingual push notification dispatch engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>Emergency alert broadcasted successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Target Zone:
              </label>
              <select
                value={targetZoneId}
                onChange={(e) => setTargetZoneId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              >
                {zonesList.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Severity Level:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              >
                <option value="critical">CRITICAL — Severe Danger</option>
                <option value="high">HIGH — Evacuation Warning</option>
                <option value="medium">MEDIUM — Advisory</option>
                <option value="low">LOW — Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              English Message (Primary):
            </label>
            <textarea
              rows={3}
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              placeholder="Enter official emergency broadcast message..."
              className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>Real-Time Neural Translation Preview</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-slate-500 block">Hindi (हिंदी):</span>
                <input
                  type="text"
                  value={translatedHi}
                  onChange={(e) => setTranslatedHi(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-slate-500 block">Kannada (ಕನ್ನಡ):</span>
                <input
                  type="text"
                  value={translatedKa}
                  onChange={(e) => setTranslatedKa(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting || !messageEn.trim()}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all border border-red-400/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Alert'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
