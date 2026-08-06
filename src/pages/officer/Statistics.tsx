import React from 'react';
import { useOfficerContext } from '@/lib/officerContext';
import { mockShelters } from '@/mocks';
import {
  BarChart3,
  ShieldCheck,
  Users,
  Clock,
  Activity,
  PackageCheck,
  TrendingDown,
  Layers,
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
  AreaChart,
  Area,
} from 'recharts';

export const Statistics: React.FC = () => {
  const { incidents, dispatches, resources, riskScores } = useOfficerContext();

  const totalOccupancy = mockShelters.reduce((acc, s) => acc + s.current_occupancy, 0);
  const totalCapacity = mockShelters.reduce((acc, s) => acc + s.capacity, 0);
  const overallOccupancyPct = Math.round((totalOccupancy / totalCapacity) * 100);

  const activeIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;
  const resolvedIncidentsCount = incidents.filter((i) => i.status === 'resolved').length;
  const resolutionRatePct = incidents.length > 0 ? Math.round((resolvedIncidentsCount / incidents.length) * 100) : 0;

  const totalResourcesQty = resources.reduce((acc, r) => acc + r.quantity, 0);
  const highestRiskZone = riskScores.reduce((prev, current) => (prev.score > current.score ? prev : current));

  // Time-series data for Incidents vs Response Latency Trend (Over 24h timeline)
  const timeSeriesData = [
    { time: '12:00', incidents: 2, responseTimeMin: 18.5, dispatchedUnits: 1 },
    { time: '14:00', incidents: 4, responseTimeMin: 16.2, dispatchedUnits: 3 },
    { time: '16:00', incidents: 7, responseTimeMin: 15.0, dispatchedUnits: 5 },
    { time: '18:00', incidents: 12, responseTimeMin: 14.2, dispatchedUnits: 8 },
    { time: '20:00', incidents: 9, responseTimeMin: 12.8, dispatchedUnits: 7 },
    { time: '22:00', incidents: 5, responseTimeMin: 11.5, dispatchedUnits: 4 },
  ];

  // Resource Allocation & Stock Depletion data
  const resourceChartData = resources.map((r) => {
    const allocated = Math.round(r.quantity * 0.4);
    const remaining = r.quantity - allocated;
    return {
      name: r.name.length > 18 ? `${r.name.slice(0, 18)}...` : r.name,
      available: remaining,
      reserved: allocated,
      total: r.quantity,
    };
  });

  return (
    <div className="space-y-5">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            Command Analytics & Incident Trends
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            Operational response metrics, SLA latency trends & resource allocation analytics
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#45464d]">
          <BarChart3 className="h-3.5 w-3.5 text-[#2563eb]" />
          <span>Real-time Telemetry Analytics</span>
        </div>
      </div>

      {/* ── Metric Summary Cards Grid ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg SOS → Dispatch
            </span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">12.4 min</div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> ↓ 2.1 min under target SLA
          </p>
        </div>

        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resource Stock Units
            </span>
            <PackageCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalResourcesQty}</div>
          <p className="text-[11px] text-slate-400 mt-1">{resources.length} categories active</p>
        </div>

        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resolution Rate
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{resolutionRatePct}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{resolvedIncidentsCount} of {incidents.length} resolved</p>
        </div>

        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Peak Zone Risk
            </span>
            <Activity className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{highestRiskZone.score}/100</div>
          <p className="text-[11px] text-slate-400 mt-1">Zone: {highestRiskZone.zone_id}</p>
        </div>
      </div>

      {/* ── Interactive Visual Charts Section ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Time-series Line Chart (Incidents vs Response Latency Trend) */}
        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-4 shadow-md space-y-3 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Incidents vs Response Latency Trend (24h)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live SLA Monitor</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px', fontSize: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="incidents"
                  name="Incidents Reported"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38bdf8' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="responseTimeMin"
                  name="Response Latency (min)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f43f5e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Stacked Bar Chart (Resource Allocation & Stock Depletion) */}
        <div className="bg-[#0f172a] text-white border border-slate-800 rounded p-4 shadow-md space-y-3 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Resource Allocation & Stock Depletion Matrix
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Inventory Status</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px', fontSize: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="available" name="Available Stock" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="reserved" name="Reserved / Allocated" fill="#f59e0b" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown & Shelter Capacity Progress Bar Grid ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incidents Category Distribution */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <div className="border-b border-[#c6c6cd] pb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1b1b1d]">
              Active Incidents Category Breakdown
            </span>
            <span className="text-[11px] text-[#76777d] font-mono">{incidents.length} Total</span>
          </div>

          <div className="space-y-3 text-[12px]">
            <div>
              <div className="flex justify-between mb-1 text-[#1b1b1d] font-medium">
                <span>Flood / Waterlog Rescue ({incidents.filter((i) => i.category === 'flood' || i.category === 'rescue').length})</span>
                <strong className="font-mono">
                  {Math.round((incidents.filter((i) => i.category === 'flood' || i.category === 'rescue').length / incidents.length) * 100)}%
                </strong>
              </div>
              <div className="h-2.5 bg-[#eae7e9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563eb] rounded-full"
                  style={{
                    width: `${Math.round((incidents.filter((i) => i.category === 'flood' || i.category === 'rescue').length / incidents.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[#1b1b1d] font-medium">
                <span>Medical Emergency ({incidents.filter((i) => i.category === 'medical').length})</span>
                <strong className="font-mono">
                  {Math.round((incidents.filter((i) => i.category === 'medical').length / incidents.length) * 100)}%
                </strong>
              </div>
              <div className="h-2.5 bg-[#eae7e9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ba1a1a] rounded-full"
                  style={{
                    width: `${Math.round((incidents.filter((i) => i.category === 'medical').length / incidents.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[#1b1b1d] font-medium">
                <span>Fire & Electrical ({incidents.filter((i) => i.category === 'fire').length})</span>
                <strong className="font-mono">
                  {Math.round((incidents.filter((i) => i.category === 'fire').length / incidents.length) * 100)}%
                </strong>
              </div>
              <div className="h-2.5 bg-[#eae7e9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c2410c] rounded-full"
                  style={{
                    width: `${Math.round((incidents.filter((i) => i.category === 'fire').length / incidents.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shelter Capacity Distribution */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 space-y-3 shadow-sm">
          <div className="border-b border-[#c6c6cd] pb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1b1b1d]">
              Evacuation Camp Bed Capacity
            </span>
            <span className="text-[11px] text-[#76777d] font-mono">{mockShelters.length} Camps</span>
          </div>

          <div className="space-y-3 text-[12px]">
            {mockShelters.map((s) => {
              const pct = Math.round((s.current_occupancy / s.capacity) * 100);
              return (
                <div key={s.id}>
                  <div className="flex justify-between mb-1 text-[#1b1b1d] font-medium">
                    <span className="truncate max-w-[200px]">{s.name}</span>
                    <span className="font-bold font-mono">
                      {s.current_occupancy}/{s.capacity} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#eae7e9] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 90 ? 'bg-[#ba1a1a]' : pct >= 75 ? 'bg-[#c2410c]' : 'bg-[#0f172a]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
