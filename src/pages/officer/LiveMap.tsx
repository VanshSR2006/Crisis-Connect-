import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOfficerContext } from '@/lib/officerContext';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { Button } from '@/components/ui/Button';
import {
  Map,
  Layers,
  MapPin,
  X,
  Radio,
  Send,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const LiveMap: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { incidents, selectedIncidentId, setSelectedIncidentId, riskScores, dispatches } = useOfficerContext();

  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const getSeverityPinColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#ba1a1a] text-white ring-4 ring-red-200 animate-pulse';
      case 'high':
        return 'bg-[#c2410c] text-white ring-2 ring-orange-200';
      case 'medium':
        return 'bg-[#515f74] text-white';
      default:
        return 'bg-[#15803d] text-white';
    }
  };

  // Mock lat/lng to percentage positioning on visual map box
  const getMapCoords = (lat: number, lng: number) => {
    // Map bounding region centered on Delhi NCR (28.4 to 28.7 lat, 77.0 to 77.3 lng)
    const top = Math.max(10, Math.min(85, ((28.7 - lat) / 0.3) * 100));
    const left = Math.max(10, Math.min(85, ((lng - 77.0) / 0.3) * 100));
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.liveMap.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {t('officer.liveMap.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#45464d]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
          {t('officer.liveMap.gisTelemetryLive')}
        </div>
      </div>

      {/* ── Map Container + Controls + Side Detail Drawer ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left GIS Control Panel (Stitch Map Settings Style) */}
        <div className="bg-white border border-[#c6c6cd] rounded p-3.5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-[#f0edef] pb-2">
            <SlidersHorizontal className="h-4 w-4 text-[#0f172a]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
              {t('officer.liveMap.mapLayerControls')}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-2 rounded bg-[#f6f3f5] border border-[#c6c6cd] cursor-pointer">
              <span className="font-semibold text-[#1b1b1d] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#2563eb]" />
                {t('officer.liveMap.floodRiskHeatmap')}
              </span>
              <input
                type="checkbox"
                checked={showRiskOverlay}
                onChange={(e) => setShowRiskOverlay(e.target.checked)}
                className="rounded border-[#c6c6cd] text-[#2563eb] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#f6f3f5] border border-[#c6c6cd] cursor-pointer">
              <span className="font-semibold text-[#1b1b1d] flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                {t('officer.liveMap.evacuationShelters')}
              </span>
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                className="rounded border-[#c6c6cd] text-[#2563eb] focus:ring-0"
              />
            </label>
          </div>

          {/* Quick Zone Vulnerability Summary */}
          <div className="border-t border-[#f0edef] pt-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d]">
              {t('officer.liveMap.evaluatedZoneRisk')}
            </span>
            {riskScores.map((score) => (
              <div key={score.id} className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-[#1b1b1d]">{score.zone_id}</span>
                <SeverityBadge severity={score.level} showIcon={false} />
              </div>
            ))}
          </div>
        </div>

        {/* Center/Main GIS Map Workspace */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded overflow-hidden shadow-sm relative min-h-[460px] flex flex-col justify-between p-4">
          {/* Map Top Bar */}
          <div className="flex items-center justify-between z-10 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded text-white text-[11px]">
            <div className="flex items-center gap-2">
              <Map className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-bold tracking-wider uppercase">Sector Grid: Delhi NCR</span>
            </div>
            <span className="text-slate-400">Lat 28.61° N · Lng 77.20° E</span>
          </div>

          {/* Simulated GIS Tactical Grid View background */}
          <div className="absolute inset-0 bg-[#0f172a] opacity-90 flex items-center justify-center overflow-hidden">
            {/* Grid Pattern overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(#334155 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* Risk Overlay zones visualization */}
            {showRiskOverlay && (
              <>
                <div className="absolute top-1/4 left-1/4 w-44 h-44 rounded-full bg-red-600/20 border-2 border-red-500/40 blur-sm animate-pulse pointer-events-none" />
                <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full bg-amber-500/20 border-2 border-amber-400/40 blur-xs pointer-events-none" />
              </>
            )}

            {/* Map Incident Pins */}
            {incidents.map((inc) => {
              const coords = getMapCoords(inc.lat, inc.lng);
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  style={{ top: coords.top, left: coords.left }}
                  className={`absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 ${
                    isSelected ? 'scale-125 z-30' : ''
                  }`}
                  title={`${inc.title} (${inc.severity.toUpperCase()})`}
                >
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold shadow-lg whitespace-nowrap ${getSeverityPinColor(
                      inc.severity
                    )} ${isSelected ? 'ring-4 ring-white' : ''}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{inc.id}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Legend Footer */}
          <div className="z-10 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded text-white text-[10px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" /> {t('common.critical')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#c2410c]" /> {t('common.high')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]" /> {t('officer.liveMap.dispatched')}
              </span>
            </div>
            <span className="text-slate-400">{t('officer.liveMap.clickPinToView')}</span>
          </div>
        </div>

        {/* Right Column: Selected Incident Detail Drawer */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-4 shadow-sm flex flex-col justify-between">
          {selectedIncident ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between border-b border-[#f0edef] pb-2">
                <div>
                  <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider font-mono block">
                    ID: {selectedIncident.id}
                  </span>
                  <h3 className="text-sm font-bold text-[#1b1b1d] leading-snug mt-0.5">
                    {selectedIncident.title}
                  </h3>
                </div>
                <SeverityBadge severity={selectedIncident.severity} showIcon={false} />
              </div>

              <p className="text-xs text-[#45464d] leading-relaxed">{selectedIncident.description}</p>

              <div className="space-y-1.5 text-xs bg-[#f6f3f5] p-2.5 rounded border border-[#c6c6cd]">
                <div className="flex items-center justify-between text-[#45464d]">
                  <span>{t('common.status')}:</span>
                  <strong className="uppercase text-[#0f172a]">{selectedIncident.status}</strong>
                </div>
                <div className="flex items-center justify-between text-[#45464d]">
                  <span>{t('officer.liveMap.category')}:</span>
                  <strong className="capitalize text-[#0f172a]">{selectedIncident.category}</strong>
                </div>
                <div className="flex items-center justify-between text-[#45464d]">
                  <span>{t('officer.dashboard.zone')}:</span>
                  <strong className="font-mono text-[#0f172a]">{selectedIncident.zone_id}</strong>
                </div>
                <div className="flex items-center justify-between text-[#45464d]">
                  <span>{t('officer.liveMap.reported')}:</span>
                  <span>{formatDate(selectedIncident.created_at)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  onClick={() => navigate('/officer/dispatch')}
                >
                  <Radio className="h-4 w-4" />
                  <span>{t('officer.liveMap.dispatchRescueUnit')}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-[#76777d] text-xs">
              {t('officer.liveMap.selectIncident')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
