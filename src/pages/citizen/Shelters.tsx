import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { useLanguage } from '@/lib/languageContext';
import { Shelter } from '@/types';
import { MapPin, Phone, Users, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

type ShelterFilter = 'all' | 'open' | 'full';

export const Shelters: React.FC = () => {
  const { shelters, isLoadingShelters, isErrorShelters } = useCitizenContext();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ShelterFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredShelters = shelters.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalOpen = shelters.filter((s) => s.status === 'open').length;
  const totalBedsFree = shelters.reduce((acc, s) => acc + (s.capacity - s.current_occupancy), 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: t('common.open'),
          icon: CheckCircle,
          badgeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'full':
        return {
          label: t('citizen.shelters.atCapacity'),
          icon: XCircle,
          badgeClasses: 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]',
        };
      default:
        return {
          label: t('common.closed'),
          icon: AlertCircle,
          badgeClasses: 'bg-[#eae7e9] text-[#45464d] border border-[#c6c6cd]',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header with Shelter Background Image ──────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        {/* Background Image related to shelters */}
        <img
          src="/shelter_header_bg.jpg"
          alt="Emergency Evacuation Shelter"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        {/* Soft Dark Gradient Overlay so shelter image remains clearly visible while text is crisp */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/45 to-slate-950/60 pointer-events-none" />

        {/* Header Content Overlay */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>EMERGENCY RELIEF NETWORK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('citizen.shelters.title')}
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs flex items-center gap-2">
              <span>{totalOpen} {t('citizen.shelters.openShelters')}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{totalBedsFree} {t('citizen.shelters.bedsAvailable')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg">
              <span className="block text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">{totalBedsFree}</span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                {t('common.bedsFree')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('citizen.shelters.searchPlaceholder')}
            className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] font-semibold"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex gap-1 shrink-0 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]">
          {(['all', 'open', 'full'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                filter === opt
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_4px_10px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border border-blue-400/40 -translate-y-0.5'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {t(`common.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shelters Cards List ───────────────────────────── */}
      <div className="space-y-4">
        {isLoadingShelters ? (
          <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-10 text-center text-[#76777d] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">Loading evacuation shelters...</p>
          </div>
        ) : isErrorShelters ? (
          <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-10 text-center text-red-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
            <p className="text-xs font-bold">Unable to load shelters. Please check connection.</p>
          </div>
        ) : filteredShelters.length === 0 ? (
          <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-10 text-center text-[#76777d] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
            <p className="text-sm font-extrabold text-slate-800">{t('citizen.shelters.noShelters')}</p>
          </div>
        ) : (
          filteredShelters.map((shelter) => {
            const statusConfig = getStatusConfig(shelter.status);
            const StatusIcon = statusConfig.icon;
            const occupancyPct = Math.round((shelter.current_occupancy / shelter.capacity) * 100);
            const availableBeds = shelter.capacity - shelter.current_occupancy;

            return (
              <div
                key={shelter.id}
                className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_38px_-8px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none transition-all duration-200 ease-out"
              >
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-slate-200/80 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-100/90 to-slate-50">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-[#1b1b1d] truncate drop-shadow-xs">{shelter.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-slate-600">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      <span className="truncate">{shelter.location_name}</span>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex-shrink-0 shadow-xs ${statusConfig.badgeClasses}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5 space-y-2.5">
                  {/* Occupancy Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-semibold text-[#45464d] flex items-center gap-1.5 uppercase tracking-[0.05em] text-[11px]">
                        <Users className="h-3.5 w-3.5 text-[#2563eb]" />
                        {t('citizen.shelters.occupancy')}
                      </span>
                      <span className="font-bold text-[#1b1b1d]">
                        {shelter.current_occupancy} / {shelter.capacity}{' '}
                        <span className="text-[10px] font-medium text-[#76777d]">({occupancyPct}% full)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#eae7e9] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct >= 90
                            ? 'bg-[#ba1a1a]'
                            : occupancyPct >= 75
                            ? 'bg-[#c2410c]'
                            : 'bg-[#2563eb]'
                        }`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Contact & Beds info */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0edef] text-xs">
                    <div className="flex items-center gap-1.5 text-[#45464d]">
                      <Phone className="h-3.5 w-3.5 text-[#76777d]" />
                      <span>{t('citizen.shelters.contact')} <strong className="text-[#1b1b1d]">{shelter.contact_number}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {availableBeds > 0
                        ? `${availableBeds} ${t('common.bedsFree')}`
                        : t('common.full')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
