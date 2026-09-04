import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAlerts } from '@/lib/api/alerts';
import { realtimeClient } from '@/lib/api/websocket';
import { CreateAlertModal } from '@/components/officer/CreateAlertModal';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SeverityLevel, Alert } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  Plus,
  RefreshCw,
  Globe,
  Radio,
  Clock,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

import { getZones } from '@/lib/api/zones';

export const Alerts: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zoneMap, setZoneMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | SeverityLevel>('all');

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, fetchedZones] = await Promise.all([
        getAlerts(),
        getZones().catch(() => []),
      ]);
      setAlerts(data);
      if (fetchedZones && fetchedZones.length > 0) {
        const map: Record<string, string> = {};
        fetchedZones.forEach((z) => {
          map[z.id] = z.name;
        });
        setZoneMap(map);
      }
    } catch (err) {
      console.warn('[OfficerAlerts] Error loading alerts:', err);
    } finally {
      setIsLoading(false);
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
            zone_id: payload.zone_id,
            target_zone_id: payload.zone_id,
            message_en: payload.message_en,
            message: payload.message_en,
            message_translated: payload.message_translated || {},
            severity: (payload.severity as SeverityLevel) || 'medium',
            issued_at: payload.issued_at || new Date().toISOString(),
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

  const filteredAlerts = selectedSeverity === 'all'
    ? alerts
    : alerts.filter((a) => a.severity === selectedSeverity);

  const criticalCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;

  return (
    <div className="space-y-5">
      {/* ── Header Card with Background Image ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/broadcast_header_bg.jpg"
          alt="Emergency Broadcast Alerts"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
              <span>MULTILINGUAL BROADCAST HUB</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-400" />
              <span>{t('officer.alerts.title', { defaultValue: 'Emergency Broadcast Alerts' })}</span>
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              {t('officer.alerts.subtitle', { defaultValue: 'Issue multilingual emergency alerts to zone citizens' })} · <strong className="text-red-400 font-bold">{criticalCount} critical active</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="danger"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all border border-red-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Issue New Alert</span>
            </Button>

            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg hidden sm:block">
              <span className="block text-2xl font-black text-red-400 font-mono drop-shadow-sm">
                {alerts.length}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                Live Broadcasts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Broadcast Feed Card ─────────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20 shadow-xs">
              <Bell className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider">
              Active Broadcast Stream ({filteredAlerts.length})
            </span>
          </div>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1 text-[11px] font-extrabold text-blue-600 hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Refresh Feed
          </button>
        </div>

        <div className="divide-y divide-slate-200/80">
          {filteredAlerts.map((alert) => {
            const zoneName = zoneMap[alert.target_zone_id || alert.zone_id || ''] || alert.target_zone_id || alert.zone_id || 'All Zones';
            return (
              <div key={alert.id} className="p-5 space-y-3 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {alert.title || `EMERGENCY ALERT — ${alert.severity.toUpperCase()}`}
                    </span>
                    <span className="text-[10px] font-mono font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                      <MapPin className="h-3 w-3 inline mr-1 text-red-600" />
                      {zoneName}
                    </span>
                  </div>
                  <SeverityBadge severity={alert.severity} showIcon={false} />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] text-xs font-semibold text-slate-800 leading-relaxed">
                  {alert.message_en || alert.message || 'Emergency notification issued.'}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Multilingual Broadcast Live (EN / HI / KA)</span>
                  </div>
                  <span className="font-mono">{formatDate(alert.issued_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchAlerts}
      />
    </div>
  );
};
