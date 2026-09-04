import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfficerContext } from '@/lib/officerContext';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { Activity, Droplets, Waves, TrendingUp, AlertTriangle, ShieldAlert, Layers, MousePointerClick } from 'lucide-react';

export const RiskHeatmap: React.FC = () => {
  const { t } = useTranslation();
  const { riskZones, isLoadingRisk, isErrorRisk, selectedZoneId, setSelectedZoneId } = useOfficerContext();

  const highestScore = riskZones.length > 0 ? Math.max(...riskZones.map((s) => s.score)) : 0;
  const activeZone = selectedZoneId ? riskZones.find((s) => s.zone_id === selectedZoneId) || null : null;

  const getHeatColor = (score: number) => {
    if (score >= 85) return 'bg-red-600 text-white border-red-500 shadow-red-900/50';
    if (score >= 70) return 'bg-orange-600 text-white border-orange-500 shadow-orange-900/50';
    if (score >= 40) return 'bg-amber-500/30 text-amber-200 border-amber-500/70 font-semibold';
    return 'bg-emerald-800/60 text-emerald-100 border-emerald-600';
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header Card with Background Image ────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/news/assam_floods.jpg"
          alt="AI Risk Heatmap & Flood Prediction"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>AI RISK PREDICTION ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('officer.riskHeatmap.title')}
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              {t('officer.riskHeatmap.subtitle')} · {riskZones.length} {t('officer.riskHeatmap.zonesMonitored')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg">
              <span className="block text-2xl font-black text-amber-400 font-mono drop-shadow-sm">
                {highestScore}/100
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                Max Risk Index
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Risk Summary Alert ────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-wide">
            {t('officer.riskHeatmap.criticalFloodWarning')}
          </p>
          <p className="text-xs font-semibold text-amber-900 mt-0.5">
            Maximum risk score detected is <strong className="font-mono">{highestScore}/100</strong> across monitored zones.
          </p>
        </div>
      </div>

      {/* ── Dark Command Center Visual Heatmap Matrix Card ───────── */}
      <div className="bg-slate-900 text-white border-2 border-slate-800 rounded-2xl p-5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {t('officer.riskHeatmap.spatialVulnerabilityMatrix')}
            </h2>
          </div>

          {/* Heat Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block" /> Severe (&gt;85)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-orange-600 inline-block" /> High (70-85)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Advisory (40-70)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-800 inline-block" /> Low (&lt;40)
            </span>
          </div>
        </div>

        {/* Heatmap Grid Cells */}
        {isLoadingRisk ? (
          <div className="py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">Loading risk data...</div>
        ) : isErrorRisk ? (
          <div className="py-10 text-center text-red-500 font-bold text-xs">Failed to load risk zones.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {riskZones.map((zone) => {
              const isSelected = selectedZoneId === zone.zone_id;
              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.zone_id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer shadow-md ${getHeatColor(
                    zone.score
                  )} ${isSelected ? 'ring-4 ring-yellow-400 scale-105 z-10 shadow-xl' : 'hover:scale-[1.02]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black uppercase tracking-wide opacity-90 truncate max-w-[90px]">
                      {zone.name}
                    </span>
                    <SeverityBadge severity={zone.risk_level} showIcon={false} />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">{zone.score}</div>
                  <span className="text-[10px] font-mono opacity-85 mt-1 block">ZONE: {zone.zone_id}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone Detail Panel */}
      {activeZone && (
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-black uppercase text-slate-900">
              Vulnerability Analysis — Zone: {activeZone.name} ({activeZone.zone_id})
            </h3>
            <SeverityBadge severity={activeZone.risk_level} showIcon={false} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-black">Precipitation Index</span>
              <strong className="text-slate-900 text-sm font-mono">{activeZone.factors?.rainfall || '48 mm/h'}</strong>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-black">Drainage Clearance</span>
              <strong className="text-slate-900 text-sm font-mono">{activeZone.factors?.drainage || '22% Capacity'}</strong>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-black">Population Density</span>
              <strong className="text-slate-900 text-sm font-mono">{activeZone.factors?.population || 'High Density'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
