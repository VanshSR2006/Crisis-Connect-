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
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onAlertCreated,
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

  // Load real zones from backend API on mount
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

  // Update translation fields dynamically as officer types English message
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

      const msgTrans: Record<string, string> = {
        en: messageEn.trim(),
        hi: finalHi,
        ka: finalKa,
      };

      const res = await createAlert({
        zone_id: targetZoneId,
        message_en: messageEn.trim(),
        message_translated: msgTrans,
        severity,
      });

      if (res) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setMessageEn('');
          setTranslatedHi('');
          setTranslatedKa('');
          onAlertCreated?.();
          onClose();
        }, 1200);
      } else {
        setErrorMsg('Failed to broadcast alert. API server returned an error.');
      }
    } catch (err) {
      console.error('[CreateAlertModal] Error submitting alert:', err);
      setErrorMsg('Network error while issuing broadcast alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#c6c6cd] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#f0edef] flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-600 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Issue Emergency Broadcast Alert
              </h3>
              <p className="text-[11px] text-slate-300">
                Target Zone Broadcast · Automated Multilingual Translation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-900 text-xs p-3 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3 rounded flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold uppercase">Emergency Alert Broadcasted Successfully!</span>
            </div>
          )}

          {/* Zone Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b1d] uppercase tracking-wider mb-1">
              Target Disaster Zone
            </label>
            <select
              value={targetZoneId}
              onChange={(e) => setTargetZoneId(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            >
              {zonesList.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.id})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b1d] uppercase tracking-wider mb-1">
              Alert Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['critical', 'high', 'medium', 'low'] as SeverityLevel[]).map((sev) => {
                const isSelected = severity === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-1 text-center rounded border text-xs font-bold uppercase tracking-wider transition-all ${
                      isSelected
                        ? sev === 'critical'
                          ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-500'
                          : sev === 'high'
                          ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-500'
                          : sev === 'medium'
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500'
                          : 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500'
                        : 'bg-[#f6f3f5] text-[#45464d] border-[#c6c6cd] hover:bg-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>
          </div>

          {/* English Alert Input */}
          <div>
            <label className="block text-xs font-bold text-[#1b1b1d] uppercase tracking-wider mb-1">
              Emergency Message (English)
            </label>
            <textarea
              rows={3}
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              placeholder="e.g. Flash flood warning issued for Yamuna basin. Evacuate low-lying areas immediately."
              disabled={isSubmitting}
              className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>

          {/* Multilingual Translation Inputs / Previews */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              <Globe className="h-4 w-4 text-[#2563eb]" />
              <span>Multilingual Alert Content (EN / HI / KA)</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Hindi Translation (HI):
              </label>
              <input
                type="text"
                value={translatedHi}
                onChange={(e) => setTranslatedHi(e.target.value)}
                placeholder="Auto-generated or enter Hindi translation (e.g. आपके क्षेत्र में भारी बारिश की संभावना है।)"
                disabled={isSubmitting}
                className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Kannada Translation (KA):
              </label>
              <input
                type="text"
                value={translatedKa}
                onChange={(e) => setTranslatedKa(e.target.value)}
                placeholder="Auto-generated or enter Kannada translation (e.g. ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಭಾರಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ.)"
                disabled={isSubmitting}
                className="w-full text-xs p-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0edef]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting || !messageEn.trim()}
              className="bg-[#ba1a1a] hover:bg-[#991b1b] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Broadcast Alert</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
