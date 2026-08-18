import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCitizenContext } from '@/lib/citizenContext';
import { useLanguage } from '@/lib/languageContext';
import { mockAlerts } from '@/mocks';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SeverityLevel } from '@/types';
import { Bell, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export const Alerts: React.FC = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');

  const filteredAlerts = severityFilter === 'all'
    ? mockAlerts
    : mockAlerts.filter((a) => a.severity === severityFilter);

  const severityOptions: { labelKey: string; value: 'all' | SeverityLevel }[] = [
    { labelKey: 'common.all', value: 'all' },
    { labelKey: 'common.critical', value: 'critical' },
    { labelKey: 'common.high', value: 'high' },
    { labelKey: 'common.medium', value: 'medium' },
    { labelKey: 'common.low', value: 'low' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Page Header & Language Selector Bar ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#c6c6cd] rounded p-3 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('citizen.alerts.title')}
          </h1>
          <p className="text-[12px] text-[#45464d] mt-0.5">
            {t('citizen.alerts.subtitle')}
          </p>
        </div>

        {/* Multilingual Language Toggle UI */}
        <LanguageToggle />
      </div>

      {/* ── Severity Filter Tabs ───────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto shadow-sm">
        {severityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSeverityFilter(opt.value)}
            className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${
              severityFilter === opt.value
                ? 'bg-[#0f172a] text-white'
                : 'text-[#45464d] hover:bg-[#eae7e9]'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Alerts Feed List ────────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#76777d]">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">{t('citizen.alerts.noAlerts')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0edef]">
            {filteredAlerts.map((alert, idx) => {
              // Dynamically choose translated title & message based on selected language!
              const title = alert.title_translated?.[language] || alert.title;
              const message = alert.message_translated?.[language] || alert.message;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 flex flex-col gap-2 transition-colors ${
                    idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
                  } ${alert.severity === 'critical' ? 'border-l-4 border-l-[#ba1a1a]' : ''}`}
                >
                  {/* Top Row: Severity + Title + Timestamp */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      <SeverityBadge severity={alert.severity} showIcon={false} />
                      <h3 className="text-sm font-bold text-[#1b1b1d] leading-snug">{title}</h3>
                    </div>
                    <span className="text-[11px] text-[#76777d] whitespace-nowrap flex-shrink-0 font-medium">
                      {formatDate(alert.issued_at)}
                    </span>
                  </div>

                  {/* Message translated */}
                  <p className="text-xs text-[#45464d] leading-relaxed font-normal">{message}</p>

                  {/* Footer metadata */}
                  <div className="flex items-center gap-3 text-[11px] text-[#76777d] border-t border-[#f0edef] pt-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{t('citizen.alerts.issued')} {formatDate(alert.issued_at)}</span>
                    </div>
                    <span>·</span>
                    <span>{t('citizen.alerts.zone')} <strong className="font-mono text-[#1b1b1d]">{alert.target_zone_id}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
