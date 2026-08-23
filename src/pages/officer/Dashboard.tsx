import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOfficerContext } from '@/lib/officerContext';
import { mockAlerts } from '@/mocks';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { MapPlaceholder } from '@/components/shared/MapPlaceholder';
import {
  AlertTriangle,
  Radio,
  Activity,
  Users,
  MapPin,
  ChevronRight,
  Map as MapIcon,
  FileText,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { incidents, dispatches, riskZones, setSelectedIncidentId, isCrisisMode, setIsCrisisMode } = useOfficerContext();

  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  const highCount = incidents.filter(i => i.severity === 'high').length;
  const activeDispatchesCount = dispatches.filter(d => d.status !== 'completed').length;
  const highestRisk = riskZones.length > 0 ? Math.max(...riskZones.map(r => r.score)) : 0;
  const highestRiskZone = riskZones.find(r => r.score === highestRisk);

  const recentIncidents = incidents.slice(0, 5);

  const kpiCards = [
    {
      label: t('officer.dashboard.activeIncidents'),
      value: incidents.length,
      sub: `${criticalCount} ${t('common.critical')} · ${highCount} ${t('common.high')}`,
      icon: AlertTriangle,
      valueColor: 'text-[#ba1a1a]',
      iconColor: 'text-[#ba1a1a]',
      onClick: () => navigate('/officer/incidents'),
    },
    {
      label: t('officer.dashboard.dispatchedUnits'),
      value: activeDispatchesCount,
      sub: `${dispatches.length} ${t('officer.dashboard.totalDispatchOrders')}`,
      icon: Radio,
      valueColor: 'text-[#0f172a]',
      iconColor: 'text-[#2563eb]',
      onClick: () => navigate('/officer/dispatch'),
    },
    {
      label: t('officer.dashboard.highestRiskScore'),
      value: `${highestRisk} / 100`,
      sub: highestRiskZone ? `${t('officer.dashboard.zone')} ${highestRiskZone.name}` : '—',
      icon: Activity,
      valueColor: 'text-[#c2410c]',
      iconColor: 'text-[#c2410c]',
      onClick: () => navigate('/officer/risk-heatmap'),
    },
    {
      label: t('officer.dashboard.activeBroadcasts'),
      value: mockAlerts.length,
      sub: t('officer.dashboard.multilingualAlertsLive'),
      icon: Users,
      valueColor: 'text-[#0f172a]',
      iconColor: 'text-emerald-600',
      onClick: () => navigate('/officer/incidents'),
    },
  ];

  const quickNavLinks = [
    { label: t('officer.dashboard.liveGisMap'), path: '/officer/live-map', icon: MapIcon, desc: t('officer.dashboard.liveGisMapDesc') },
    { label: t('officer.dashboard.incidentList'), path: '/officer/incidents', icon: FileText, desc: t('officer.dashboard.incidentListDesc') },
    { label: t('officer.dashboard.dispatchCenter'), path: '/officer/dispatch', icon: Radio, desc: t('officer.dashboard.dispatchCenterDesc') },
    { label: t('officer.dashboard.riskHeatmap'), path: '/officer/risk-heatmap', icon: Activity, desc: t('officer.dashboard.riskHeatmapDesc') },
    { label: t('officer.dashboard.analytics'), path: '/officer/statistics', icon: BarChart3, desc: t('officer.dashboard.analyticsDesc') },
  ];

  return (
    <div className={`space-y-5 transition-colors duration-500 ${isCrisisMode ? 'bg-[#1b1b1d]/5 -mx-4 px-4 py-2 rounded-lg border border-red-900/10' : ''}`}>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.dashboard.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {t('officer.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider cursor-pointer bg-white px-2 py-1 rounded border border-[#c6c6cd] shadow-sm hover:bg-slate-50 transition-colors">
            <span className={isCrisisMode ? "text-[#ba1a1a]" : "text-[#45464d]"}>Crisis Mode</span>
            <div className={`relative inline-block w-7 h-3.5 rounded-full transition-colors ${isCrisisMode ? 'bg-[#ba1a1a]' : 'bg-[#c6c6cd]'}`}>
              <input type="checkbox" className="opacity-0 w-0 h-0 absolute" checked={isCrisisMode} onChange={(e) => setIsCrisisMode(e.target.checked)} />
              <span className={`absolute left-[2px] top-[2px] bg-white w-2.5 h-2.5 rounded-full transition-transform ${isCrisisMode ? 'transform translate-x-3.5' : ''}`} />
            </div>
          </label>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#45464d]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            {t('officer.dashboard.liveFeedActive')}
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`bg-white border rounded p-3 cursor-pointer transition-all shadow-sm ${
                isCrisisMode && idx === 0 
                  ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a] shadow-red-100' 
                  : 'border-[#c6c6cd] hover:border-[#2563eb]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#45464d]">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</div>
              <p className="text-[11px] text-[#76777d] mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Middle Row: Quick Nav ────────── */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-[#c6c6cd] rounded p-3 shadow-sm flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#1b1b1d] block mb-2.5">
            {t('officer.dashboard.commandQuickAccess', 'Command Quick Access')}
          </span>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {quickNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col justify-between p-2.5 rounded bg-[#f6f3f5] hover:bg-[#d5e3fc] border border-[#c6c6cd] hover:border-[#2563eb] text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-[#0f172a]" />
                    <ChevronRight className="h-3 w-3 text-[#76777d]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1b1b1d] block">{item.label}</span>
                    <span className="text-[10px] text-[#76777d] truncate block">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Two Column: GIS Map & Critical Incident Queue ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: GIS Map */}
        <div className="lg:col-span-2 bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm flex flex-col">
          <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between bg-[#f0edef]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#45464d]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1b1b1d]">
                {t('officer.dashboard.liveGeospatialOverview')}
              </span>
            </div>
            <button
              onClick={() => navigate('/officer/live-map')}
              className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
            >
              {t('officer.dashboard.openInteractiveGis')} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <MapPlaceholder height="h-72" />
          </div>
        </div>

        {/* Right Column: Incident Queue */}
        <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm flex flex-col">
          <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between bg-[#f0edef]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ba1a1a]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1b1b1d]">
                {t('officer.dashboard.criticalQueue')} ({incidents.length})
              </span>
            </div>
            <button
              onClick={() => navigate('/officer/incidents')}
              className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5"
            >
              {t('common.all')} <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-[#f0edef] flex-1 overflow-y-auto max-h-72">
            {recentIncidents.map((incident, idx) => (
              <div
                key={incident.id}
                onClick={() => {
                  setSelectedIncidentId(incident.id);
                  navigate('/officer/live-map');
                }}
                className={`p-3 hover:bg-[#f6f3f5] cursor-pointer transition-colors ${
                  idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
                } ${incident.severity === 'critical' ? 'border-l-2 border-l-[#ba1a1a]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[12px] font-bold text-[#1b1b1d] truncate">{incident.title}</h4>
                    <p className="text-[11px] text-[#45464d] truncate mt-0.5">{incident.description}</p>
                  </div>
                  <SeverityBadge severity={incident.severity} showIcon={false} />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-[#76777d]">
                  <span className="uppercase font-semibold tracking-wider text-[#0f172a]">{t(`common.${incident.status}`)}</span>
                  <span className="font-mono">{incident.zone_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

