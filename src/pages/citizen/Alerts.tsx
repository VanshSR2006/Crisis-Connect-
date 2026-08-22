import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/lib/languageContext';
import { getAlerts } from '@/lib/api/alerts';
import { realtimeClient } from '@/lib/api/websocket';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SeverityLevel, Alert } from '@/types';
import { Bell, Clock, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export const Alerts: React.FC = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn('[Alerts] Error loading alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to WebSocket realtime alert broadcasts with deduplication
    const unsubAlert = realtimeClient.subscribe('alert.created', (payload: any) => {
      if (payload && payload.id) {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === payload.id)) {
            return prev;
          }
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


  const filteredAlerts = severityFilter === 'all'
    ? alerts
    : alerts.filter((a) => a.severity === severityFilter);

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
            {t('citizen.alerts.title', { defaultValue: 'Broadcast Alerts Feed' })}
          </h1>
          <p className="text-[12px] text-[#45464d] mt-0.5">
            {t('citizen.alerts.subtitle', { defaultValue: 'Real-time public safety notifications · Zone broadcasts' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="p-2 bg-white border border-[#c6c6cd] hover:bg-[#f6f3f5] rounded text-[#45464d] transition-colors"
            title="Refresh Alerts"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <LanguageToggle />
        </div>
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
            {t(opt.labelKey, { defaultValue: opt.value.toUpperCase() })}
          </button>
        ))}
      </div>

      {/* ── Alerts Feed List ────────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#76777d]">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {t('citizen.alerts.noAlerts', { defaultValue: 'No emergency alerts match this filter.' })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0edef]">
            {filteredAlerts.map((alert, idx) => {
              // Multilingual resolution with safe fallback to English/predefined text
              const title =
                alert.title_translated?.[language] ||
                alert.title ||
                `EMERGENCY ALERT — ${alert.severity?.toUpperCase() || 'CRITICAL'}`;

              const message =
                alert.message_translated?.[language] ||
                (alert as any).message_en ||
                alert.message ||
                'Emergency notification issued for your zone. Follow safety guidelines.';

              const zone = alert.target_zone_id || (alert as any).zone_id || 'All Zones';

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
                      <span>{t('citizen.alerts.issued', { defaultValue: 'Issued:' })} {formatDate(alert.issued_at)}</span>
                    </div>
                    <span>·</span>
                    <span>
                      {t('citizen.alerts.zone', { defaultValue: 'Zone:' })}{' '}
                      <strong className="font-mono text-[#1b1b1d]">{zone}</strong>
                    </span>
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
