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
      {/* ── Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#c6c6cd] rounded p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h1 className="text-xl font-bold tracking-tight text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
              {t('officer.alerts.title', { defaultValue: 'Emergency Broadcast Alerts' })}
            </h1>
          </div>
          <p className="text-[13px] text-[#45464d] mt-1">
            {t('officer.alerts.subtitle', {
              defaultValue: 'Issue and manage multilingual emergency alerts broadcasted directly to citizen apps.',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="p-2.5 bg-white border border-[#c6c6cd] hover:bg-[#f6f3f5] rounded text-[#45464d] transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="danger"
            size="sm"
            className="bg-[#ba1a1a] hover:bg-[#991b1b] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Emergency Alert</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Quick Overview Stats ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#c6c6cd] rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#76777d] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Broadcasts</span>
            <Bell className="h-4 w-4 text-[#2563eb]" />
          </div>
          <p className="text-2xl font-bold text-[#1b1b1d]">{alerts.length}</p>
          <p className="text-[11px] text-[#45464d] mt-0.5">Active disaster alerts issued</p>
        </div>

        <div className="bg-white border border-[#c6c6cd] rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#76777d] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">High / Critical Alerts</span>
            <Radio className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[#ba1a1a]">{criticalCount}</p>
          <p className="text-[11px] text-[#45464d] mt-0.5">Requiring immediate citizen action</p>
        </div>

        <div className="bg-white border border-[#c6c6cd] rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[#76777d] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Supported Languages</span>
            <Globe className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">3 Languages</p>
          <p className="text-[11px] text-[#45464d] mt-0.5">English (EN), Hindi (HI), Kannada (KA)</p>
        </div>
      </div>

      {/* ── Severity Filters ──────────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-1 overflow-x-auto shadow-sm">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
              selectedSeverity === sev
                ? 'bg-[#0f172a] text-white'
                : 'text-[#45464d] hover:bg-[#f6f3f5]'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* ── Alerts Table / List ──────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded shadow-sm overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#76777d]">
            <Bell className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-semibold text-[#1b1b1d]">No broadcast alerts found</p>
            <p className="text-xs text-[#76777d] mt-0.5">Click "Create Emergency Alert" above to issue a new broadcast.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0edef]">
            {filteredAlerts.map((alert) => {
              const rawZoneId = alert.zone_id || alert.target_zone_id || 'All Zones';
              const zoneLabel = zoneMap[rawZoneId] ? `${zoneMap[rawZoneId]} (${rawZoneId})` : rawZoneId;
              const msgEn = alert.message_en || alert.message || 'Emergency alert issued.';
              const msgHi = alert.message_translated?.hi;
              const msgKa = alert.message_translated?.ka;

              return (
                <div key={alert.id} className="p-4 space-y-3 hover:bg-[#fcf8fa] transition-colors">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <SeverityBadge severity={alert.severity} />
                      <div className="flex items-center gap-1.5 text-xs text-[#45464d] font-mono bg-[#f6f3f5] px-2 py-0.5 rounded border border-[#c6c6cd]">
                        <MapPin className="h-3 w-3 text-[#2563eb]" />
                        <span>Zone: {zoneLabel}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Broadcasted
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#76777d] font-medium whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(alert.issued_at)}</span>
                    </div>
                  </div>

                  {/* Multilingual Messages Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-[#f6f3f5] p-3 rounded border border-[#c6c6cd]">
                    {/* EN */}
                    <div className="space-y-1 bg-white p-2.5 rounded border border-[#c6c6cd]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] block">
                        English (Default)
                      </span>
                      <p className="text-xs text-[#1b1b1d] font-medium">{msgEn}</p>
                    </div>

                    {/* HI */}
                    <div className="space-y-1 bg-white p-2.5 rounded border border-[#c6c6cd]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                        Hindi (हिन्दी)
                      </span>
                      <p className="text-xs text-[#1b1b1d] font-medium">
                        {msgHi || <span className="text-[#76777d] italic">Translation unavailable</span>}
                      </p>
                    </div>

                    {/* KA */}
                    <div className="space-y-1 bg-white p-2.5 rounded border border-[#c6c6cd]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        Kannada (ಕನ್ನಡ)
                      </span>
                      <p className="text-xs text-[#1b1b1d] font-medium">
                        {msgKa || <span className="text-[#76777d] italic">Translation unavailable</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Component ───────────────────────────────────── */}
      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlertCreated={fetchAlerts}
      />
    </div>
  );
};
