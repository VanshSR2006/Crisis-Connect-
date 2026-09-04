import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getZoneDemand,
  ZoneDemandResponse,
} from '@/lib/api/demand';
import { useOfficerContext } from '@/lib/officerContext';
import { mockAlerts } from '@/mocks';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { OfficerMiniMap } from '@/components/officer/OfficerMiniMap';
import {
  AlertTriangle,
  Radio,
  Activity,
  Users,
  MapPin,
  ChevronRight,
  Map as MapIcon,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    incidents,
    dispatches,
    riskZones,
    setSelectedIncidentId,
    isCrisisMode,
    setIsCrisisMode,
  } = useOfficerContext();

  const [selectedZoneId, setSelectedZoneId] =
    React.useState('z-silchar');

  const [zoneDemand, setZoneDemand] =
    React.useState<ZoneDemandResponse | null>(null);

  const [demandLoading, setDemandLoading] =
    React.useState(false);

  React.useEffect(() => {
    const loadZoneDemand = async () => {
      setDemandLoading(true);

      try {
        const data = await getZoneDemand(selectedZoneId);
        setZoneDemand(data);
      } catch (error) {
        console.error(
          'Failed to load zone demand:',
          error
        );
        setZoneDemand(null);
      } finally {
        setDemandLoading(false);
      }
    };

    loadZoneDemand();
  }, [selectedZoneId]);

  const criticalCount = incidents.filter(
    (i) => i.severity === 'critical'
  ).length;

  const highCount = incidents.filter(
    (i) => i.severity === 'high'
  ).length;

  const activeDispatchesCount = dispatches.filter(
    (d) => d.status !== 'completed'
  ).length;

  const highestRisk =
    riskZones.length > 0
      ? Math.max(...riskZones.map((r) => r.score))
      : 0;

  const highestRiskZone = riskZones.find(
    (r) => r.score === highestRisk
  );

  const recentIncidents = incidents.slice(0, 5);

  const kpiCards = [
    {
      label: t('officer.dashboard.activeIncidents'),
      value: incidents.length,
      sub: `${criticalCount} ${t(
        'common.critical'
      )} · ${highCount} ${t('common.high')}`,
      icon: AlertTriangle,
      valueColor: 'text-red-600',
      iconBg:
        'bg-red-500/10 border-red-500/20 text-red-600',
      onClick: () =>
        navigate('/officer/incidents'),
    },
    {
      label: t('officer.dashboard.dispatchedUnits'),
      value: activeDispatchesCount,
      sub: `${dispatches.length} ${t(
        'officer.dashboard.totalDispatchOrders'
      )}`,
      icon: Radio,
      valueColor: 'text-slate-900',
      iconBg:
        'bg-blue-500/10 border-blue-500/20 text-blue-600',
      onClick: () =>
        navigate('/officer/dispatch'),
    },
    {
      label: t('officer.dashboard.highestRiskScore'),
      value: `${highestRisk} / 100`,
      sub: highestRiskZone
        ? `${t(
            'officer.dashboard.zone'
          )} ${highestRiskZone.name}`
        : '—',
      icon: Activity,
      valueColor: 'text-amber-600',
      iconBg:
        'bg-amber-500/10 border-amber-500/20 text-amber-600',
      onClick: () =>
        navigate('/officer/risk-heatmap'),
    },
    {
      label: t('officer.dashboard.activeBroadcasts'),
      value: mockAlerts.length,
      sub: t(
        'officer.dashboard.multilingualAlertsLive'
      ),
      icon: Users,
      valueColor: 'text-slate-900',
      iconBg:
        'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      onClick: () =>
        navigate('/officer/alerts'),
    },
  ];

  const quickNavLinks = [
    {
      label: t('officer.dashboard.liveGisMap'),
      path: '/officer/live-map',
      icon: MapIcon,
      desc: t(
        'officer.dashboard.liveGisMapDesc'
      ),
    },
    {
      label: 'Emergency Alerts',
      path: '/officer/alerts',
      icon: Users,
      desc: 'Issue & broadcast alerts',
    },
    {
      label: t('officer.dashboard.incidentList'),
      path: '/officer/incidents',
      icon: FileText,
      desc: t(
        'officer.dashboard.incidentListDesc'
      ),
    },
    {
      label: t('officer.dashboard.dispatchCenter'),
      path: '/officer/dispatch',
      icon: Radio,
      desc: t(
        'officer.dashboard.dispatchCenterDesc'
      ),
    },
    {
      label: t('officer.dashboard.riskHeatmap'),
      path: '/officer/risk-heatmap',
      icon: Activity,
      desc: t(
        'officer.dashboard.riskHeatmapDesc'
      ),
    },
  ];

  return (
    <div
      className={`space-y-5 transition-colors duration-500 ${
        isCrisisMode
          ? 'bg-red-950/10 -mx-4 px-4 py-2 rounded-2xl border border-red-900/20'
          : ''
      }`}
    >
      {/* ── Header Banner Card ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/officer_command_bg.jpg"
          alt="Emergency Operations Command Center"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>HQ COMMAND OVERVIEW</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('officer.dashboard.title')}
            </h1>

            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              {t('officer.dashboard.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Crisis Mode Toggle */}
            <label
              className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider cursor-pointer px-3.5 py-2.5 rounded-xl border backdrop-blur-md transition-all duration-200 shadow-md ${
                isCrisisMode
                  ? 'bg-red-600 text-white border-red-500 shadow-red-600/30 animate-pulse'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 text-white border-slate-700'
              }`}
            >
              <ShieldAlert className="h-4 w-4 text-red-400" />

              <span>Crisis Mode</span>

              <div
                className={`relative inline-block w-8 h-4 rounded-full transition-colors ${
                  isCrisisMode
                    ? 'bg-white/30'
                    : 'bg-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0 absolute"
                  checked={isCrisisMode}
                  onChange={(e) =>
                    setIsCrisisMode(e.target.checked)
                  }
                />

                <span
                  className={`absolute left-[2px] top-[2px] bg-white w-3 h-3 rounded-full transition-transform ${
                    isCrisisMode
                      ? 'transform translate-x-4'
                      : ''
                  }`}
                />
              </div>
            </label>

            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg hidden md:block">
              <span className="block text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
                {incidents.length}
              </span>

              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                {t(
                  'officer.dashboard.activeIncidents'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.16)] hover:-translate-y-1 ${
                isCrisisMode && idx === 0
                  ? 'ring-2 ring-red-500 border-red-500 shadow-red-500/20'
                  : 'hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  {card.label}
                </span>

                <div
                  className={`p-2 rounded-xl border shadow-xs ${card.iconBg}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div
                className={`text-2xl font-black ${card.valueColor}`}
              >
                {card.value}
              </div>

              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Command Quick Access ───────────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
        <span className="text-[12px] font-black uppercase tracking-wider text-slate-900 block mb-3">
          {t(
            'officer.dashboard.commandQuickAccess',
            'Command Quick Access'
          )}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickNavLinks.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-left transition-all duration-150 group shadow-xs hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-slate-200/70 border border-slate-300 shadow-xs group-hover:bg-blue-100 group-hover:border-blue-300">
                    <Icon className="h-4 w-4 text-slate-800 group-hover:text-blue-700" />
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div>
                  <span className="text-xs font-black text-slate-900 block tracking-tight">
                    {item.label}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500 truncate block mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Resource Demand & Shortage Intelligence ───────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[12px] font-black uppercase tracking-wider text-slate-900">
              Resource Demand &amp; Shortage Intelligence
            </span>

            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              Demographic demand compared with available relief resources
            </p>
          </div>

          <select
            value={selectedZoneId}
            onChange={(e) =>
              setSelectedZoneId(e.target.value)
            }
            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="z-silchar">Silchar</option>
            <option value="z-lakhipur">Lakhipur</option>
            <option value="z-katigorah">Katigorah</option>
          </select>
        </div>

        {demandLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Loading resource demand...
          </div>
        ) : zoneDemand ? (
          <>
            {/* Demand Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Food
                </div>

                <div className="text-lg font-black text-slate-900">
                  {zoneDemand.demand?.food_packets?.toLocaleString() ??
                    '0'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Water
                </div>

                <div className="text-lg font-black text-slate-900">
                  {zoneDemand.demand?.drinking_water_liters?.toLocaleString() ??
                    '0'}{' '}
                  L
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Medical Kits
                </div>

                <div className="text-lg font-black text-slate-900">
                  {zoneDemand.demand?.medical_kits?.toLocaleString() ??
                    '0'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  Sanitation
                </div>

                <div className="text-lg font-black text-slate-900">
                  {zoneDemand.demand?.sanitation_kits?.toLocaleString() ??
                    '0'}
                </div>
              </div>
            </div>

            {/* Demographic Information */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                  Zone Demographics &amp; Vulnerability
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="px-3 py-2">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Population
                  </div>

                  <div className="text-sm font-black text-slate-900">
                    {zoneDemand.demand?.population?.toLocaleString() ??
                      '0'}
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Households
                  </div>

                  <div className="text-sm font-black text-slate-900">
                    {zoneDemand.demand?.households?.toLocaleString() ??
                      '0'}
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Vulnerability Index
                  </div>

                  <div className="text-sm font-black text-red-600">
                    {zoneDemand.demand?.vulnerability_index ??
                      '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Shortage Information */}
            <div className="mt-3 border border-slate-200 rounded-xl p-3 bg-slate-50/70">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Critical Resource Shortages
              </div>

              {zoneDemand.shortages &&
              zoneDemand.shortages.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {zoneDemand.shortages.map(
                    (shortage, index) => (
                      <div
                        key={`${shortage.resource_type}-${index}`}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="font-semibold text-slate-900">
                          {shortage.resource_type}
                        </span>

                        <span className="text-red-600 font-semibold">
                          Shortage:{' '}
                          {shortage.shortage?.toLocaleString() ??
                            '0'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  No critical resource shortages reported
                  for this zone.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-xs text-red-600">
            Unable to load resource demand.
          </div>
        )}
      </div>

      {/* ── GIS Map & Critical Incident Queue ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GIS Map */}
        <div className="lg:col-span-2 bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-200/70 rounded-lg border border-slate-300 shadow-xs">
                <MapPin className="h-4 w-4 text-slate-700" />
              </div>

              <span className="text-[12px] font-black text-[#1b1b1d] uppercase tracking-wider">
                {t(
                  'officer.dashboard.liveGeospatialOverview'
                )}
              </span>
            </div>

            <button
              onClick={() =>
                navigate('/officer/live-map')
              }
              className="text-[11px] font-extrabold text-[#2563eb] hover:underline flex items-center gap-1"
            >
              {t(
                'officer.dashboard.openInteractiveGis'
              )}

              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 relative min-h-[300px]">
            <OfficerMiniMap
              incidents={incidents}
              riskZones={riskZones}
              onClickMap={() =>
                navigate('/officer/live-map')
              }
            />
          </div>
        </div>

        {/* Critical Incident Queue */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20 shadow-xs">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>

              <span className="text-[12px] font-black text-[#1b1b1d] uppercase tracking-wider">
                {t(
                  'officer.dashboard.criticalQueue'
                )}{' '}
                ({incidents.length})
              </span>
            </div>

            <button
              onClick={() =>
                navigate('/officer/incidents')
              }
              className="text-[11px] font-extrabold text-[#2563eb] hover:underline flex items-center gap-0.5"
            >
              {t('common.all')}

              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-200/80 flex-1 overflow-y-auto max-h-[360px]">
            {recentIncidents.length > 0 ? (
              recentIncidents.map(
                (incident, idx) => (
                  <div
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncidentId(
                        incident.id
                      );
                      navigate(
                        '/officer/live-map'
                      );
                    }}
                    className={`p-4 hover:bg-blue-50/60 cursor-pointer transition-colors ${
                      idx % 2 === 1
                        ? 'bg-slate-50/70'
                        : 'bg-white'
                    } ${
                      incident.severity ===
                      'critical'
                        ? 'border-l-4 border-l-red-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-slate-900 truncate">
                          {incident.title}
                        </h4>

                        <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                          {incident.description}
                        </p>
                      </div>

                      <SeverityBadge
                        severity={
                          incident.severity
                        }
                        showIcon={false}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-[10px] font-bold text-slate-500">
                      <span className="uppercase tracking-wider text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300 font-mono">
                        {t(
                          `common.${incident.status}`
                        )}
                      </span>

                      <span className="font-mono text-slate-600">
                        {incident.zone_id}
                      </span>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="flex items-center justify-center min-h-[220px] px-4 text-center">
                <div>
                  <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />

                  <p className="text-xs font-semibold text-slate-500">
                    No active incidents reported.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};