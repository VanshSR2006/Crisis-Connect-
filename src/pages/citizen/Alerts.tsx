import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/lib/languageContext';
import { getAlerts } from '@/lib/api/alerts';
import { realtimeClient } from '@/lib/api/websocket';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SeverityLevel, Alert } from '@/types';
import { Bell, Clock, RefreshCw, ShieldAlert, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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

  const getSeverityStyles = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'border-l-[6px] border-l-red-600 border-t-2 border-t-white border-b-2 border-b-red-200/80 border-r border-red-200/60 bg-gradient-to-br from-red-50/70 via-white to-red-50/30 shadow-[0_14px_32px_-6px_rgba(220,38,38,0.2),0_6px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_48px_-8px_rgba(220,38,38,0.32)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none';
      case 'high':
        return 'border-l-[6px] border-l-amber-500 border-t-2 border-t-white border-b-2 border-b-amber-200/80 border-r border-amber-200/60 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 shadow-[0_12px_28px_-6px_rgba(217,119,6,0.18),0_5px_10px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_22px_42px_-8px_rgba(217,119,6,0.28)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none';
      case 'medium':
        return 'border-l-[6px] border-l-yellow-500 border-t-2 border-t-white border-b-2 border-b-slate-300 border-r border-slate-200/90 bg-gradient-to-br from-yellow-50/40 via-white to-slate-50/50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_38px_-8px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none';
      case 'low':
      default:
        return 'border-l-[6px] border-l-blue-500 border-t-2 border-t-white border-b-2 border-b-slate-300 border-r border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_38px_-8px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none';
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header with Broadcast Background Image ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        {/* Background Image related to emergency broadcast */}
        <img
          src="/broadcast_header_bg.jpg"
          alt="Emergency Broadcast Tower & Satellite"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.1] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        {/* Soft Dark Gradient Overlay for Maximum Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/60 pointer-events-none" />

        {/* Header Content Overlay */}
        <div className="relative z-10 flex flex-row items-center justify-between gap-4 text-white">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              BROADCAST ALERTS
            </h1>
            <p className="text-yellow-400 font-extrabold text-xs sm:text-sm tracking-wide mt-1 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping inline-block" />
              <span>{alerts.filter((a) => a.severity === 'high').length} High Severity Alert{alerts.filter((a) => a.severity === 'high').length !== 1 ? 's' : ''} Active</span>
            </p>
          </div>

          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/90 hover:border-slate-500 rounded-xl text-white transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`h-4 w-4 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Severity Filter Tabs ───────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex gap-1.5 overflow-x-auto shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
        {severityOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSeverityFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
              severityFilter === opt.value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border border-blue-400/40 -translate-y-0.5'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {t(opt.labelKey, { defaultValue: opt.value.toUpperCase() })}
          </button>
        ))}
      </div>

      {/* ── Alerts Feed List ────────────────────────────────── */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-12 flex flex-col items-center justify-center text-[#76777d] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
            <div className="p-3 bg-slate-100 rounded-2xl shadow-inner mb-3">
              <Bell className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-extrabold text-slate-800">
              {t('citizen.alerts.noAlerts', { defaultValue: 'No emergency alerts match this filter.' })}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const title =
              alert.title_translated?.[language] ||
              alert.title ||
              `EMERGENCY ALERT — ${(alert.severity || 'CRITICAL').toUpperCase()}`;

            const message =
              (alert.message_translated && alert.message_translated[language] && alert.message_translated[language].trim()) ||
              (alert.message_translated && alert.message_translated['en'] && alert.message_translated['en'].trim()) ||
              (alert.message_en && alert.message_en.trim()) ||
              (alert.message && alert.message.trim()) ||
              'Emergency notification issued for your zone. Follow safety guidelines.';

            const zone = alert.zone_id || alert.target_zone_id || 'All Zones';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-5 transition-all duration-200 ease-out flex flex-col gap-3 ${getSeverityStyles(
                  alert.severity
                )}`}
              >
                {/* Header Row: Badge + Emergency Alert Title */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <SeverityBadge severity={alert.severity} showIcon={false} />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 drop-shadow-xs">
                      {title}
                    </span>
                  </div>
                </div>

                {/* Message Body with Recessed Inset Depth */}
                <p className="text-xs font-extrabold text-slate-900 leading-relaxed bg-white/95 p-3.5 rounded-xl border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
                  {message}
                </p>

                {/* Footer Metadata */}
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-bold pt-1">
                  <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Issued {formatDate(alert.issued_at)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>Zone: <strong className="font-mono text-slate-900">{zone}</strong></span>
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
