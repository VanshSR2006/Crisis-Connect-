import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useOfficerContext } from '@/lib/officerContext';
import { getShelters } from '@/lib/api/shelters';
import {
  Clock,
  Package,
  ShieldCheck,
  Activity,
  TrendingDown,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const { incidents, resources, riskZones } = useOfficerContext();
  const { data: shelters = [] } = useQuery({
    queryKey: ['shelters'],
    queryFn: getShelters,
    staleTime: 60000,
  });

  const highestRiskZone =
    riskZones.length > 0
      ? riskZones.reduce((prev, current) => (prev.score > current.score ? prev : current))
      : null;

  const resolvedIncidentsCount = incidents.filter((i) => i.status === 'resolved').length;
  const totalIncidentsCount = incidents.length;
  const resolutionRatePct =
    totalIncidentsCount > 0 ? Math.round((resolvedIncidentsCount / totalIncidentsCount) * 100) : 0;

  const totalResourcesQty = resources.reduce(
    (acc, r) => acc + (r.available_quantity ?? r.quantity ?? 0),
    0
  );

  // Recharts dual latency trend series
  const trendChartData = [
    { time: '02:00', incidents: 3, responseLatency: 15.0 },
    { time: '13:00', incidents: 1, responseLatency: 15.0 },
    { time: '14:00', incidents: 1, responseLatency: 15.0 },
    { time: '15:00', incidents: 1, responseLatency: 15.0 },
  ];

  const resourceChartData = resources.map((r) => {
    const qty = r.available_quantity ?? r.quantity ?? 0;
    return {
      name: r.name.length > 18 ? `${r.name.slice(0, 18)}...` : r.name,
      quantity: qty,
    };
  });

  const rescueCount = incidents.filter(
    (i) => i.category === 'rescue' || i.category === 'water' || i.category === 'flood'
  ).length;
  const medicalCount = incidents.filter((i) => i.category === 'medical').length;
  const otherCount = incidents.filter(
    (i) =>
      i.category === 'other' ||
      i.category === 'fire' ||
      i.category === 'landslide' ||
      i.category === 'panic'
  ).length;

  const rescuePct = totalIncidentsCount > 0 ? Math.round((rescueCount / totalIncidentsCount) * 100) : 67;
  const medicalPct = totalIncidentsCount > 0 ? Math.round((medicalCount / totalIncidentsCount) * 100) : 17;
  const otherPct = totalIncidentsCount > 0 ? Math.round((otherCount / totalIncidentsCount) * 100) : 16;

  return (
    <div className="space-y-6">
      {/* ── Page Header Card with Background Image ────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/analytics_header_bg.jpg"
          alt="Command Analytics Telemetry Dashboard"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>TELEMETRY & SLA ANALYTICS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              Command Analytics & Incident Trends
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              Operational response metrics, SLA latency trends & resource allocation analytics
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg">
              <span className="block text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
                12.4m
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                Avg Response SLA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 4 KPI Cards Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AVG SOS -> DISPATCH */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              AVG SOS → DISPATCH
            </span>
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              12.4 min
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 mt-1">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>2.1 min under target SLA</span>
            </div>
          </div>
        </div>

        {/* Card 2: AVAILABLE STOCK & PERSONNEL */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              AVAILABLE STOCK & PERSONNEL
            </span>
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalResourcesQty}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {resources.length} categories active
            </p>
          </div>
        </div>

        {/* Card 3: RESOLUTION RATE */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              RESOLUTION RATE
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {resolutionRatePct}%
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {resolvedIncidentsCount} of resolved in total: {totalIncidentsCount}
            </p>
          </div>
        </div>

        {/* Card 4: COMPOSITE RISK SCORE */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              COMPOSITE RISK SCORE
            </span>
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {highestRiskZone?.score || 88}/100
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">
              Zone: {highestRiskZone?.name || 'Silchar Urban Sector 4'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Charts Grid (2 Columns) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart Card: Incidents vs Latency */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              INCIDENTS VS RESPONSE LATENCY TREND (24H)
            </h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Live SLA Monitor
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#0ea5e9" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="incidents"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0ea5e9' }}
                  name="Incidents Reported"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="responseLatency"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f43f5e' }}
                  name="Response Latency (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart Card: Resource Allocation */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              RESOURCE ALLOCATION & STOCK DEPLETION MATRIX
            </h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Inventory Status
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                />
                <Bar
                  dataKey="quantity"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  name="Available Stock"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Breakdown Cards (2 Columns) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Incidents Category Breakdown */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              ACTIVE INCIDENTS CATEGORY BREAKDOWN
            </h2>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {totalIncidentsCount} Total
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                <span>Flood / Waterlog Rescue ({rescueCount})</span>
                <span>{rescuePct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${rescuePct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                <span>Medical Emergency ({medicalCount})</span>
                <span>{medicalPct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${medicalPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                <span>Fire & Electrical ({otherCount})</span>
                <span>{otherPct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${otherPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Evacuation Camp Bed Capacity */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              EVACUATION CAMP BED CAPACITY
            </h2>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {shelters.length} Camps
            </span>
          </div>

          <div className="space-y-4">
            {shelters.length === 0 ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                    <span>Silchar District Relief Camp</span>
                    <span>150/500 (30%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: '30%' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              shelters.map((s) => {
                const occ = s.current_occupancy ?? 0;
                const cap = s.capacity || 100;
                const pct = Math.round((occ / cap) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>{s.name}</span>
                      <span>
                        {occ}/{cap} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-slate-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
