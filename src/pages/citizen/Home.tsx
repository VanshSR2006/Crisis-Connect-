import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import { MapPlaceholder } from '@/components/shared/MapPlaceholder';
import { StatusStepper } from '@/components/shared/StatusStepper';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { formatDate } from '@/lib/utils';
import { mockAlerts } from '@/mocks';
import {
  AlertTriangle,
  MapPin,
  Bell,
  ArrowRight,
  Phone,
  CheckCircle,
  Home as ShelterIcon,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, activeIncident, shelters } = useCitizenContext();
  const { language } = useLanguage();
  const { t } = useTranslation();

  // Find critical or high alerts
  const criticalAlerts = mockAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high');

  // Sorted nearby shelters (open shelters first, then by available capacity)
  const nearbyShelters = [...shelters]
    .sort((a, b) => (b.capacity - b.current_occupancy) - (a.capacity - a.current_occupancy))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      {/* ── Active Critical Broadcast Alert Banner ─────────────── */}
      {criticalAlerts.length > 0 && (
        <div className="bg-[#ba1a1a] text-white px-4 py-3 rounded flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide">{criticalAlerts[0].title_translated?.[language] || criticalAlerts[0].title}</p>
            <p className="text-xs text-red-100 mt-0.5 line-clamp-2">{criticalAlerts[0].message_translated?.[language] || criticalAlerts[0].message}</p>
          </div>
          <span className="text-[10px] font-semibold text-red-200 whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatDate(criticalAlerts[0].issued_at)}
          </span>
        </div>
      )}

      {/* ── Primary SOS CTA Action ──────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
              {t('citizen.home.emergencyDispatchActive')}
            </span>
          </div>
          <h2 className="text-base font-bold text-[#1b1b1d]">{t('citizen.home.needHelp')}</h2>
          <p className="text-[12px] text-[#45464d]">
            {t('citizen.home.tapBelow')}
          </p>
        </div>

        <Button
          variant="danger"
          size="lg"
          className="w-full sm:w-auto font-black text-sm uppercase tracking-widest px-6 py-3 bg-[#ba1a1a] hover:bg-[#991b1b] text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          onClick={() => navigate('/citizen/sos-report')}
        >
          <Phone className="h-5 w-5" />
          <span>{t('citizen.home.reportEmergency')}</span>
        </Button>
      </div>

      {/* ── Active Incident Progress Tracker (if any exists) ─────── */}
      {activeIncident && (
        <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between bg-[#f0edef]">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#2563eb]" />
              <span className="text-[12px] font-semibold text-[#1b1b1d] uppercase tracking-[0.05em]">
                {t('citizen.home.sosTracker')}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#76777d] font-semibold">
              ID: {activeIncident.id}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#1b1b1d]">{activeIncident.title}</h3>
                <p className="text-xs text-[#45464d] mt-0.5">{activeIncident.description}</p>
              </div>
              <SeverityBadge severity={activeIncident.severity} showIcon={false} />
            </div>

            <StatusStepper currentStatus={activeIncident.status} />

            <div className="p-2.5 bg-[#f6f3f5] rounded border border-[#c6c6cd] flex items-center justify-between text-[11px] text-[#45464d]">
              <span>{t('common.status')}: <strong className="uppercase text-[#0f172a]">{t(`common.${activeIncident.status}`)}</strong></span>
              <span>{t('common.updated')} {formatDate(activeIncident.created_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Map Visual ─────────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#45464d]" />
            <span className="text-[12px] font-semibold text-[#1b1b1d] uppercase tracking-[0.05em]">
              {t('citizen.home.locationMap')}
            </span>
          </div>
          <span className="text-[11px] text-[#45464d] font-medium">{t('citizen.home.gpsActive')}</span>
        </div>
        <MapPlaceholder height="h-48" />
      </div>

      {/* ── Nearby Shelters Quick Overview ──────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShelterIcon className="h-4 w-4 text-[#45464d]" />
            <span className="text-[12px] font-semibold text-[#1b1b1d] uppercase tracking-[0.05em]">
              {t('citizen.home.nearbyShelters')}
            </span>
          </div>
          <button
            onClick={() => navigate('/citizen/shelters')}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#2563eb] hover:underline"
          >
            {t('citizen.home.viewAll')} ({shelters.length}) <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-[#f0edef]">
          {nearbyShelters.map((shelter, idx) => {
            const availableBeds = shelter.capacity - shelter.current_occupancy;
            return (
              <div
                key={shelter.id}
                className={`p-3 flex items-center justify-between gap-3 ${
                  idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-semibold text-[#1b1b1d] truncate">
                    {shelter.name}
                  </h4>
                  <p className="text-[11px] text-[#45464d] mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{shelter.location_name}</span>
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                      shelter.status === 'open'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]'
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
