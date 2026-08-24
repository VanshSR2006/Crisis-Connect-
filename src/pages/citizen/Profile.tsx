import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { useLanguage } from '@/lib/languageContext';
import type { LanguageCode } from '@/lib/i18n';
import { Select } from '@/components/ui/Select';
import { User, Phone, Mail, MapPin, ShieldCheck, Globe, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { clearAuth } from '@/lib/auth';

export const Profile: React.FC = () => {
  const { user, setZoneId } = useCitizenContext();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'ka', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('citizen.profile.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {t('citizen.profile.subtitle')}
          </p>
        </div>
        <LanguageToggle />
      </div>

      {/* ── User Identity Card ─────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        {/* Header Banner */}
        <div className="bg-[#0f172a] px-4 py-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-[#2563eb] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-xl font-black text-white">{initials}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{user.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                {t('citizen.profile.verifiedCitizen')}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Details List */}
        <div className="divide-y divide-[#f0edef]">
          <div className="px-4 py-3 flex items-center gap-3">
            <Mail className="h-4 w-4 text-[#76777d] flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#76777d]">{t('citizen.profile.email')}</p>
              <p className="text-[13px] font-medium text-[#1b1b1d] mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <Phone className="h-4 w-4 text-[#76777d] flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#76777d]">{t('citizen.profile.phone')}</p>
              <p className="text-[13px] font-medium text-[#1b1b1d] mt-0.5">{user.phone}</p>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <MapPin className="h-4 w-4 text-[#76777d] flex-shrink-0" />
            <div className="w-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#76777d]">{t('citizen.profile.zone')}</p>
              <Select
                label=""
                value={user.zone_id}
                onChange={(e) => setZoneId(e.target.value)}
                options={[
                  { label: 'Uttarakhand Himalayan Sector (UK-01)', value: 'zone-north-01' },
                  { label: 'Assam Brahmaputra Flood Basin (AS-02)', value: 'zone-east-02' },
                  { label: 'Odisha & Bengal Coastal Belt (OD-03)', value: 'zone-south-03' },
                  { label: 'Kerala & Konkan Coastal Zone (KL-04)', value: 'zone-central-04' },
                ]}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Language Preference Selector ───────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#f0edef] pb-2">
          <Globe className="h-4 w-4 text-[#2563eb]" />
          <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
            {t('citizen.profile.languagePreference')}
          </h3>
        </div>

        <p className="text-xs text-[#45464d]">
          {t('citizen.profile.selectLanguage')}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`p-3 rounded border text-center transition-all ${
                language === lang.code
                  ? 'bg-[#d5e3fc] border-[#2563eb] text-[#0f172a] font-bold ring-1 ring-[#2563eb]'
                  : 'bg-white border-[#c6c6cd] text-[#45464d] hover:bg-[#f6f3f5]'
              }`}
            >
              <span className="block text-xs font-bold">{lang.native}</span>
              <span className="block text-[10px] text-[#76777d] mt-0.5">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Role Switcher CTA ──────────────────────────────── */}
      <button
        onClick={() => {
          clearAuth();
          navigate('/login');
        }}
        className="w-full flex items-center justify-center gap-2 bg-white border border-[#c6c6cd] text-[#45464d] hover:bg-[#f6f3f5] hover:text-[#1b1b1d] rounded py-3 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
      >
        <LogOut className="h-4 w-4 text-[#76777d]" />
        <span>{t('citizen.profile.logout')}</span>
      </button>
    </div>
  );
};
