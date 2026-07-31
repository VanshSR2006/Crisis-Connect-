import React, { useState } from 'react';
import { useOfficerContext } from '@/lib/officerContext';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { Activity, Droplets, Waves, TrendingUp, AlertTriangle, ShieldAlert, Layers, MousePointerClick } from 'lucide-react';

export const RiskHeatmap: React.FC = () => {
  const { riskScores } = useOfficerContext();
  // Default to null on page load — user must click a card to select it
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const highestScore = Math.max(...riskScores.map((s) => s.score));
  const activeZone = selectedZoneId ? riskScores.find((s) => s.zone_id === selectedZoneId) || null : null;

  const getHeatColor = (score: number) => {
    if (score >= 85) return 'bg-red-600 text-white border-red-500 shadow-red-900/50';
    if (score >= 70) return 'bg-orange-600 text-white border-orange-500 shadow-orange-900/50';
    if (score >= 40) return 'bg-amber-500/30 text-amber-200 border-amber-500/70 font-semibold';
    return 'bg-emerald-800/60 text-emerald-100 border-emerald-600';
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            AI Risk Heatmap & Flood Prediction
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            Real-time hydrometeorological risk matrix · {riskScores.length} zones monitored
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#45464d]">
          <Activity className="h-3.5 w-3.5 text-[#c2410c] animate-pulse" />
          <span>AI Predictive Model v2.4 Active</span>
        </div>
      </div>

      {/* ── Risk Summary Alert ────────────────────────────── */}
      <div className="bg-[#ffedd5] border border-[#fdba74] text-[#c2410c] rounded p-3 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide">
            Critical Flood Inundation Warning
          </p>
          <p className="text-[12px] text-[#9a3412] mt-0.5">
            North Riverine Flood Basin score reached <strong className="font-mono">{highestScore}/100</strong> due to sustained 112.5mm precipitation and river elevation crossing 206.1m mark.
          </p>
        </div>
      </div>

      {/* ── Dark Command Center Visual Heatmap Matrix ───────── */}
      <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-4 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Spatial Vulnerability Heat Matrix (Delhi NCR Sector Grids)
            </h2>
          </div>

          {/* Heat Legend */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" /> Severe (&gt;85)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-orange-600 inline-block" /> High (70-85)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Advisory (40-70)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-800 inline-block" /> Low (&lt;40)
            </span>
          </div>
        </div>

        {/* Heatmap Grid Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {riskScores.map((score) => {
            const isSelected = selectedZoneId === score.zone_id;
            return (
              <button
                key={score.id}
                onClick={() => setSelectedZoneId(score.zone_id)}
                className={`p-3.5 rounded border text-left flex flex-col justify-between transition-all cursor-pointer ${getHeatColor(
                  score.score
                )} ${isSelected ? 'ring-4 ring-yellow-400 scale-105 z-10 shadow-lg' : 'hover:opacity-90'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wide opacity-90">
                    {score.zone_id}
                  </span>
                  <SeverityBadge severity={score.level} showIcon={false} />
                </div>
                <div className="text-3xl font-black">{score.score}</div>
                <span className="text-[10px] font-medium opacity-80 mt-1 block">
                  {score.rainfall_mm}mm rain · {score.river_level_m}m gauge
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Zone Metrics Detail Card (or prompt when none selected) ─── */}
      {activeZone ? (
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#2563eb]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
                Detailed Analysis — Zone: <span className="font-mono text-[#0f172a]">{activeZone.zone_id}</span>
              </h3>
            </div>
            <SeverityBadge severity={activeZone.level} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#f6f3f5] rounded border border-[#c6c6cd]">
              <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider block">
                Composite Risk Score
              </span>
              <span className="text-2xl font-bold text-[#0f172a] mt-0.5 block">{activeZone.score} / 100</span>
            </div>

            <div className="p-3 bg-[#f6f3f5] rounded border border-[#c6c6cd]">
              <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider block flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-[#2563eb]" /> Precipitation Gauge
              </span>
              <span className="text-2xl font-bold text-[#0f172a] mt-0.5 block">{activeZone.rainfall_mm} mm</span>
            </div>

            <div className="p-3 bg-[#f6f3f5] rounded border border-[#c6c6cd]">
              <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider block flex items-center gap-1">
                <Waves className="h-3.5 w-3.5 text-[#2563eb]" /> Yamuna River Water Level
              </span>
              <span className="text-2xl font-bold text-[#0f172a] mt-0.5 block">{activeZone.river_level_m} meters</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd] border-dashed rounded p-6 text-center text-[#76777d] flex flex-col items-center justify-center gap-2">
          <MousePointerClick className="h-6 w-6 text-[#2563eb]" />
          <p className="text-xs font-semibold text-[#1b1b1d]">
            No Zone Selected
          </p>
          <p className="text-[11px] text-[#76777d]">
            Click any sector zone card in the Spatial Vulnerability Matrix above to inspect detailed parameters.
          </p>
        </div>
      )}
    </div>
  );
};
