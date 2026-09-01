import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { GUEST_SOS_DESCRIPTION } from '@/lib/citizenContext';

import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import { CitizenLocationMap } from '@/components/citizen/CitizenLocationMap';
import { StatusStepper } from '@/components/shared/StatusStepper';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { formatDate } from '@/lib/utils';
import { getAlerts } from '@/lib/api/alerts';
import { realtimeClient } from '@/lib/api/websocket';
import { mockAlerts } from '@/mocks';
import { Alert, SeverityLevel } from '@/types';
import {
  AlertTriangle,
  MapPin,
  Bell,
  ArrowRight,
  Phone,
  CheckCircle,
  Home as ShelterIcon,
  Volume2,
  VolumeX
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, incidents, activeIncident, shelters, lat, lng, geoStatus } = useCitizenContext();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  const handlePlayAlertVoice = (titleText: string, messageText: string, targetLang?: string) => {
    if (typeof window === 'undefined') return;

    if (isSpeakingAudio || (window.speechSynthesis && window.speechSynthesis.speaking)) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeakingAudio(false);
      return;
    }

    // Play initial emergency alarm chime tone via Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      }
    } catch (e) {
      // Ignore web audio context restrictions if blocked
    }

    // Speak alert message out loud in Hindi / Kannada / English based on text and active language
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const activeLang = targetLang || language || 'en';
      const fullText = `${titleText}. ${messageText}`;

      // Detect language & Unicode script (Devanagari for Hindi, Kannada script for Kannada)
      const isHindi = /[\u0900-\u097F]/.test(fullText) || activeLang === 'hi';
      const isKannada = /[\u0C80-\u0CFF]/.test(fullText) || activeLang === 'ka' || activeLang === 'kn';

      const speechLang = isHindi ? 'hi-IN' : isKannada ? 'kn-IN' : 'en-US';
      const introPrefix = isHindi
        ? 'आपातकालीन चेतावनी।'
        : isKannada
          ? 'ತುರ್ತು ಎಚ್ಚರಿಕೆ.'
          : 'Attention Emergency Alert.';

      const speechText = `${introPrefix} ${titleText}. ${messageText}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = speechLang;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select best matching TTS voice for Hindi / Kannada / English if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(speechLang.slice(0, 2).toLowerCase()));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeakingAudio(true);
      utterance.onend = () => setIsSpeakingAudio(false);
      utterance.onerror = () => setIsSpeakingAudio(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(data || mockAlerts);
    } catch (err) {
      console.warn('[Home] Error loading alerts:', err);
      setAlerts(mockAlerts);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const unsubAlert = realtimeClient.subscribe('alert.created', (payload: any) => {
      if (payload && payload.id) {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === payload.id)) return prev;
          const newAlert: Alert = {
            id: payload.id,
            title: `EMERGENCY ALERT — ${(payload.severity || 'CRITICAL').toUpperCase()}`,
            message: payload.message_en || 'Emergency notification issued for your zone.',
            message_en: payload.message_en,
            message_translated: payload.message_translated || {},
            severity: (payload.severity as SeverityLevel) || 'medium',
            target_zone_id: payload.zone_id || 'z-silchar',
            issued_at: payload.issued_at || new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            issued_by_user_id: 'usr-officer-1',
          };
          return [newAlert, ...prev];
        });
      } else {
        fetchAlerts();
      }
    });

    return () => {
      unsubAlert();
    };
  }, [fetchAlerts]);

  // Find critical or high alerts
  const activeAlertsSource = alerts.length > 0 ? alerts : mockAlerts;
  const criticalAlerts = activeAlertsSource.filter((a) => a.severity === 'critical' || a.severity === 'high');

  const hasAutoAnnouncedRef = useRef<boolean>(false);

  // Automatically announce top-most critical emergency alert voice on landing / login
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if speech synthesis is already active from Login submission gesture
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      setIsSpeakingAudio(true);
      const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeakingAudio(false);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }

    // Otherwise trigger voice playback if flagged for announcement or initial landing
    const shouldAnnounce = sessionStorage.getItem('should_announce_alert') === 'true';
    if ((shouldAnnounce || !hasAutoAnnouncedRef.current) && criticalAlerts.length > 0) {
      hasAutoAnnouncedRef.current = true;
      sessionStorage.removeItem('should_announce_alert');

      const topAlert = criticalAlerts[0];
      const titleText = topAlert.title_translated?.[language] || topAlert.title || `EMERGENCY ALERT — ${topAlert.severity?.toUpperCase() || 'CRITICAL'}`;
      const msgText = (topAlert.message_translated && topAlert.message_translated[language]) || topAlert.message_en || topAlert.message || '';

      const timer = setTimeout(() => {
        handlePlayAlertVoice(titleText, msgText);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [criticalAlerts, language]);

  // Sorted nearby shelters (open shelters first, then by available capacity)
  const nearbyShelters = [...shelters]
    .sort((a, b) => (b.capacity - b.current_occupancy) - (a.capacity - a.current_occupancy))
    .slice(0, 3);

  // Filter incidents created by the currently authenticated citizen.
  // Exclude guest SOS reports (reporter_id === 'usr-guest') and sessions without a real user ID.
  const isRealUser = !!user?.id && user.id !== 'usr-guest';

  const citizenIncidents = isRealUser
    ? incidents.filter(
      (i) =>
        (i.reporter_id === user!.id || i.reported_by_user_id === user!.id) &&
        i.reporter_id !== 'usr-guest' &&
        i.description !== GUEST_SOS_DESCRIPTION
    )
    : [];

  // Determine tracker incidents to display (only authenticated citizen's backend-confirmed incidents)
  // Always sorted in descending chronological order by created_at timestamp (newest → oldest)
  const rawTrackerIncidents = citizenIncidents.length > 0
    ? citizenIncidents
    : isRealUser &&
      activeIncident &&
      (activeIncident.reporter_id === user!.id || activeIncident.reported_by_user_id === user!.id) &&
      activeIncident.reporter_id !== 'usr-guest' &&
      activeIncident.description !== GUEST_SOS_DESCRIPTION
      ? [activeIncident]
      : [];


  const trackerIncidents = [...rawTrackerIncidents].sort((a, b) => {
    const getTime = (dateStr?: string) => {
      if (!dateStr) return 0;
      let formatted = dateStr;
      if (
        typeof dateStr === 'string' &&
        dateStr.includes('T') &&
        !dateStr.endsWith('Z') &&
        !/[+-]\d{2}:\d{2}$/.test(dateStr)
      ) {
        formatted = `${dateStr}Z`;
      }
      const t = new Date(formatted).getTime();
      return isNaN(t) ? 0 : t;
    };
    return getTime(b.created_at) - getTime(a.created_at);
  });

  return (
    <div className="space-y-5">
      {/* ── Active Critical Broadcast Alert Banner (Blinking Red + Audio Voice Alert) ─────────────── */}
      {criticalAlerts.length > 0 && (
        <div className="animate-alert-blink text-white px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-red-400/40 relative overflow-hidden transition-all duration-300">
          <style>{`
            @keyframes alertBlinkRed {
              0%, 100% {
                background-color: #dc2626; /* Light vibrant red */
                box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
              }
              50% {
                background-color: #7f1d1d; /* Deep dark red */
                box-shadow: 0 4px 10px rgba(127, 29, 29, 0.2);
              }
            }
            .animate-alert-blink {
              animation: alertBlinkRed 1.8s ease-in-out infinite;
            }
          `}</style>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
              <AlertTriangle className="h-5 w-5 text-white animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black uppercase tracking-wide text-white drop-shadow-sm truncate">
                {criticalAlerts[0].title_translated?.[language] || criticalAlerts[0].title || `EMERGENCY ALERT — ${criticalAlerts[0].severity?.toUpperCase() || 'CRITICAL'}`}
              </p>
              <p className="text-xs text-red-100 font-medium leading-tight truncate">
                {(criticalAlerts[0].message_translated && criticalAlerts[0].message_translated[language] && criticalAlerts[0].message_translated[language].trim()) ||
                  (criticalAlerts[0].message_translated && criticalAlerts[0].message_translated['en'] && criticalAlerts[0].message_translated['en'].trim()) ||
                  (criticalAlerts[0].message_en && criticalAlerts[0].message_en.trim()) ||
                  (criticalAlerts[0].message && criticalAlerts[0].message.trim()) ||
                  'Emergency notification issued.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] font-mono font-bold text-red-200 hidden sm:inline-block">
              {formatDate(criticalAlerts[0].issued_at)}
            </span>

            {/* Audio Voice Alert Toggle Button placed on the EXTREME RIGHT */}
            <button
              type="button"
              onClick={() => {
                const titleText = criticalAlerts[0].title || 'Emergency Alert';
                const msgText = (criticalAlerts[0].message_translated && criticalAlerts[0].message_translated[language]) || criticalAlerts[0].message_en || criticalAlerts[0].message || '';
                handlePlayAlertVoice(titleText, msgText);
              }}
              className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md border ${isSpeakingAudio
                  ? 'bg-white text-red-700 border-white scale-105 animate-pulse'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30 hover:scale-105 active:scale-95'
                }`}
              title={isSpeakingAudio ? "Stop Voice Alert" : "Listen to Voice Alert"}
            >
              {isSpeakingAudio ? (
                <>
                  <VolumeX className="h-4.5 w-4.5 text-red-600 animate-spin" />
                  <span className="text-[10px] font-black uppercase font-mono hidden md:inline">STOP AUDIO</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4.5 w-4.5 text-white" />
                  <span className="text-[10px] font-black uppercase font-mono hidden md:inline">VOICE ALERT</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}


      {/* ── Primary SOS CTA Action ──────────────────────────────── */}
      <div className="bg-gradient-to-br from-white via-white to-red-50/40 border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_12px_28px_-6px_rgba(220,38,38,0.15),0_4px_10px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-8px_rgba(220,38,38,0.22)] hover:-translate-y-1 transition-all duration-200">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block shadow-md shadow-red-500/50" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#ba1a1a]">
              {t('citizen.home.emergencyDispatchActive')}
            </span>
          </div>
          <h2 className="text-base font-black text-[#1b1b1d] drop-shadow-xs">{t('citizen.home.needHelp')}</h2>
          <p className="text-[12px] font-semibold text-slate-600">
            {t('citizen.home.tapBelow')}
          </p>
        </div>

        <Button
          variant="danger"
          size="lg"
          className="w-full sm:w-auto font-black text-sm uppercase tracking-widest px-7 py-4 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_10px_24px_rgba(220,38,38,0.5)] hover:-translate-y-1 active:translate-y-0.5 motion-reduce:hover:transform-none transition-all duration-150 rounded-2xl border border-red-400/40"
          onClick={() => navigate('/citizen/sos-report')}
        >
          <Phone className="h-5 w-5 drop-shadow-xs" />
          <span>{t('citizen.home.reportEmergency')}</span>
        </Button>
      </div>

      {/* ── Active Incident Progress Tracker Section ─────── */}
      {trackerIncidents.map((inc) => (
        <div key={inc.id} className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.16)] hover:-translate-y-1 transition-all duration-200">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-xs">
                <CheckCircle className="h-4 w-4 text-[#2563eb]" />
              </div>
              <span className="text-[12px] font-black text-[#1b1b1d] uppercase tracking-wider">
                {t('citizen.home.sosTracker')}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-600 font-extrabold bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
              ID: {inc.id}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#1b1b1d]">{inc.title}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{inc.description}</p>
              </div>
              <SeverityBadge severity={inc.severity} showIcon={false} />
            </div>

            <StatusStepper currentStatus={inc.status} />

            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-[#45464d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] font-bold">
              <span>
                {t('common.status')}: <strong className="uppercase text-[#0f172a]">{t(`common.${inc.status}`, { defaultValue: inc.status })}</strong>
              </span>
              <span>{t('common.updated')} {formatDate(inc.created_at)}</span>
            </div>
          </div>
        </div>
      ))}


      {/* ── Location Map Visual ─────────────────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.16)] hover:-translate-y-1 transition-all duration-200">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-200/70 rounded-lg border border-slate-300 shadow-xs">
              <MapPin className="h-4 w-4 text-slate-700" />
            </div>
            <span className="text-[12px] font-black text-[#1b1b1d] uppercase tracking-wider">
              {t('citizen.home.locationMap')}
            </span>
          </div>
          <span className="text-[11px] text-slate-700 font-bold font-mono bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
            {geoStatus === 'acquired' ? t('citizen.home.gpsActive') : geoStatus === 'detecting' ? 'Detecting...' : 'GPS: ' + geoStatus.toUpperCase()}
          </span>
        </div>
        <CitizenLocationMap
          incident={activeIncident}
          userLocation={lat !== null && lng !== null ? [lat, lng] : null}
          height="h-48"
        />
      </div>


      {/* ── Nearby Shelters Quick Overview ──────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.16)] hover:-translate-y-1 transition-all duration-200">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-xs">
              <ShelterIcon className="h-4 w-4 text-emerald-700" />
            </div>
            <span className="text-[12px] font-black text-[#1b1b1d] uppercase tracking-wider">
              {t('citizen.home.nearbyShelters')}
            </span>
          </div>
          <button
            onClick={() => navigate('/citizen/shelters')}
            className="flex items-center gap-1 text-[11px] font-extrabold text-[#2563eb] hover:underline"
          >
            {t('citizen.home.viewAll')} ({shelters.length}) <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-200/80">
          {nearbyShelters.map((shelter, idx) => {
            const availableBeds = shelter.capacity - shelter.current_occupancy;
            return (
              <div
                key={shelter.id}
                className={`p-4 flex items-center justify-between gap-3 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[#1b1b1d] truncate">
                    {shelter.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-blue-600" />
                    <span>{shelter.location_name}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${shelter.status === 'open'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                  >
                    {shelter.status === 'open'
                      ? `${availableBeds} ${t('citizen.home.bedsFree')}`
                      : t('common.full')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
