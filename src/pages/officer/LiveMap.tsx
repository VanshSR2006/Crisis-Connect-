import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useOfficerContext } from '@/lib/officerContext';
import { RiskLayer } from '@/components/gis/RiskLayer';
import { ResourcePressureLayer } from '@/components/gis/ResourcePressureLayer';
import { RescueSiteLayer } from '@/components/gis/RescueSiteLayer';
import { ShelterLayer } from '@/components/gis/ShelterLayer';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { Button } from '@/components/ui/Button';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon,
  Layers,
  MapPin,
  Radio,
  SlidersHorizontal,
  Package,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { rankRescueSites, RankedRescueSite } from '@/lib/api/rescueSites';
import { ActionBar } from '@/components/officer/ActionBar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// ── Helper: Center map on selection ─────────────────────────────────────────
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// ── Helper: Pressure status label + color ────────────────────────────────────
const pressureStatusConfig = {
  adequate: { label: 'Adequate', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  under_pressure: { label: 'Under Pressure', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  critical: { label: 'Critical', badge: 'bg-indigo-900 text-white border-indigo-700' },
  no_supply: { label: 'No Supply Data', badge: 'bg-slate-100 text-slate-600 border-slate-300' },
  no_demand: { label: 'No Demand Data', badge: 'bg-slate-100 text-slate-600 border-slate-300' },
  unknown: { label: 'Unknown', badge: 'bg-slate-100 text-slate-600 border-slate-300' },
};

// ── Access status badge config ────────────────────────────────────────────────
const accessConfig = {
  accessible: { label: 'Accessible', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  limited: { label: 'Limited', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  blocked: { label: 'Blocked', cls: 'bg-red-100 text-red-800 border-red-300' },
};

export const LiveMap: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    incidents,
    isLoadingIncidents,
    isErrorIncidents,
    selectedIncidentId,
    setSelectedIncidentId,
    riskZones,
    isLoadingRisk,
    isErrorRisk,
    selectedZoneId,
    setSelectedZoneId,
    zonePressure,
    isLoadingPressure,
    isErrorPressure,
    isCrisisMode,
  } = useOfficerContext();

  // ── Layer toggles ──────────────────────────────────────────────────────────
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [showResourcePressure, setShowResourcePressure] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showRescueSites, setShowRescueSites] = useState<boolean>(true);

  // ── Detail panel tab ───────────────────────────────────────────────────────
  const [detailMode, setDetailMode] = useState<'incident' | 'pressure' | 'sites'>('incident');

  // ── Site ranking state ─────────────────────────────────────────────────────
  const [rankingEnabled, setRankingEnabled] = useState<boolean>(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [mapCenterOverride, setMapCenterOverride] = useState<[number, number] | null>(null);

  // Map defaults
  const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
  const DEFAULT_ZOOM = 11;

  const selectedIncident =
    incidents.find(i => i.id === selectedIncidentId) || (incidents.length > 0 ? incidents[0] : null);

  const selectedZonePressure = selectedZoneId
    ? zonePressure.find(z => z.zone_id === selectedZoneId) ?? null
    : null;

  // ── Reset site rankings when incident changes ──────────────────────────────
  useEffect(() => {
    setRankingEnabled(false);
    setSelectedSiteId(null);
    setMapCenterOverride(null);
  }, [selectedIncidentId]);

  // ── Rescue-site ranking query ──────────────────────────────────────────────
  const {
    data: rankedSites,
    isLoading: isLoadingSites,
    isError: isErrorSites,
    refetch: refetchSites,
  } = useQuery<RankedRescueSite[]>({
    queryKey: ['rescue-sites', selectedIncidentId],
    queryFn: () => {
      if (!selectedIncident?.lat || !selectedIncident?.lng) {
        throw new Error('Incident has no coordinates');
      }
      return rankRescueSites({
        incident_lat: selectedIncident.lat,
        incident_lng: selectedIncident.lng,
      });
    },
    enabled: rankingEnabled && !!selectedIncident?.lat && !!selectedIncident?.lng,
    staleTime: 120000, // cache for 2 min — same incident doesn't need re-rank
    retry: 1,
  });

  const sites = rankedSites ?? [];
  const selectedSite = selectedSiteId ? sites.find(s => s.id === selectedSiteId) ?? null : null;

  // ── Switch to Sites tab when ranking results arrive ────────────────────────
  useEffect(() => {
    if (rankingEnabled && !isLoadingSites) {
      setDetailMode('sites');
    }
  }, [rankingEnabled, isLoadingSites]);

  // ── Handle site selection (list or map) ────────────────────────────────────
  const handleSiteSelect = (id: string) => {
    setSelectedSiteId(id);
    const site = sites.find(s => s.id === id);
    if (site && site.lat && site.lng) {
      setMapCenterOverride([site.lat, site.lng]);
    }
    setDetailMode('sites');
  };

  // ── Zone panel switch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedZoneId) setDetailMode('pressure');
  }, [selectedZoneId]);

  const getSeverityPinColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[#ba1a1a] text-white ring-4 ring-red-200';
      case 'high': return 'bg-[#c2410c] text-white ring-2 ring-orange-200';
      case 'medium': return 'bg-[#515f74] text-white';
      default: return 'bg-[#15803d] text-white';
    }
  };

  const createCustomIcon = (incident: any, isSelected: boolean) => {
    const dim = isCrisisMode && incident.severity !== 'critical' && !isSelected;
    const iconHtml = renderToString(
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold shadow-lg whitespace-nowrap ${getSeverityPinColor(incident.severity)} ${isSelected ? 'ring-4 ring-white scale-110 z-50' : 'opacity-90'} ${dim ? 'opacity-40 grayscale' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{incident.id.slice(-4)}</span>
      </div>
    );
    return L.divIcon({
      html: iconHtml,
      className: 'custom-leaflet-icon',
      iconSize: [40, 24],
      iconAnchor: [20, 12],
    });
  };

  // Determine active map center: site > incident > default
  const activeCenter: [number, number] = mapCenterOverride
    ?? (selectedIncident?.lat && selectedIncident?.lng
        ? [selectedIncident.lat, selectedIncident.lng]
        : DEFAULT_CENTER);
  const activeZoom = mapCenterOverride ? 14 : selectedIncident?.lat ? 13 : DEFAULT_ZOOM;

  return (
    <div className="space-y-4">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.liveMap.title', 'GIS Command Map')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {t('officer.liveMap.subtitle', 'Live geospatial monitoring')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#45464d]">
          {isLoadingIncidents ? (
            <span className="text-blue-600">Connecting GIS...</span>
          ) : isErrorIncidents ? (
            <span className="text-red-600">GIS Offline</span>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
              {t('officer.liveMap.gisTelemetryLive', 'GIS Telemetry Live')}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── Left: Layer Controls ────────────────────────── */}
        <div className="bg-white border border-[#c6c6cd] rounded p-3.5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-[#f0edef] pb-2">
            <SlidersHorizontal className="h-4 w-4 text-[#0f172a]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
              {t('officer.liveMap.mapLayerControls', 'Layer Controls')}
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Risk Zones', icon: <Layers className="h-3.5 w-3.5 text-[#c2410c]" />, state: showRiskOverlay, set: setShowRiskOverlay },
              { label: 'Resource Pressure', icon: <Package className="h-3.5 w-3.5 text-[#7c3aed]" />, state: showResourcePressure, set: setShowResourcePressure },
              { label: 'Rescue Sites', icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />, state: showRescueSites, set: setShowRescueSites },
              { label: t('officer.liveMap.evacuationShelters', 'Safe Zones'), icon: <MapPin className="h-3.5 w-3.5 text-slate-500" />, state: showShelters, set: setShowShelters },
            ].map(({ label, icon, state, set }) => (
              <label key={label} className="flex items-center justify-between p-2 rounded bg-[#f6f3f5] border border-[#c6c6cd] cursor-pointer">
                <span className="font-semibold text-[#1b1b1d] flex items-center gap-1.5">
                  {icon} {label}
                </span>
                <input
                  type="checkbox"
                  checked={state}
                  onChange={e => set(e.target.checked)}
                  className="rounded border-[#c6c6cd] text-[#2563eb] focus:ring-0"
                />
              </label>
            ))}
          </div>

          {/* ── Legend ──────────────────────────────────── */}
          <div className="space-y-3 border-t border-[#f0edef] pt-3">
            {showRiskOverlay && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#76777d] block">Risk Level</span>
                {[['Critical', '#ef4444'], ['High', '#f97316'], ['Medium', '#fbbf24'], ['Low', '#15803d']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#45464d]">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {showResourcePressure && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#76777d] block">Resource Pressure</span>
                {[['Adequate', '#3b82f6'], ['Under Pressure', '#a855f7'], ['Critical', '#4f46e5']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#45464d]">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: color, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.25) 2px,rgba(255,255,255,.25) 4px)' }} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {showRescueSites && (
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#76777d] block">Rescue Sites</span>
                {[['Accessible', '#10b981'], ['Limited', '#f59e0b'], ['Blocked', '#6b7280']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#45464d]">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Zone risk list */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#76777d] block">
                {t('officer.liveMap.evaluatedZoneRisk', 'Zone Risk')}
              </span>
              {isLoadingRisk ? (
                <div className="text-[11px] text-[#76777d]">Loading...</div>
              ) : isErrorRisk ? (
                <div className="text-[11px] text-red-600">Risk layer unavailable</div>
              ) : riskZones.length === 0 ? (
                <div className="text-[11px] text-[#76777d]">No data</div>
              ) : (
                riskZones.map(zone => {
                  const isSel = selectedZoneId === zone.zone_id;
                  return (
                    <div key={zone.id}
                      className={`flex items-center justify-between text-[11px] p-1.5 rounded cursor-pointer ${isSel ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
                      onClick={() => { setSelectedZoneId(isSel ? null : zone.zone_id); if (!isSel) setDetailMode('pressure'); }}
                    >
                      <span className="font-mono font-bold text-[#1b1b1d] truncate max-w-[90px]">{zone.name}</span>
                      <SeverityBadge severity={zone.risk_level} showIcon={false} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Center: Map ─────────────────────────────────── */}
        <div className={`lg:col-span-2 bg-[#e2e8f0] border rounded overflow-hidden shadow-sm relative min-h-[480px] flex flex-col z-0 ${isCrisisMode ? 'border-red-500 shadow-red-200' : 'border-[#cbd5e1]'}`}>
          <ErrorBoundary fallbackMessage="The map encountered an error.">
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom={true} className="w-full h-full min-h-[480px]" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Center map controller */}
            <MapController center={activeCenter} zoom={activeZoom} />

            {/* Risk layer */}
            <RiskLayer isVisible={showRiskOverlay} />

            {/* Resource Pressure layer */}
            <ResourcePressureLayer isVisible={showResourcePressure} />

            {/* Shelter layer */}
            <ShelterLayer isVisible={showShelters} />

            {/* Rescue Site markers */}
            <RescueSiteLayer
              isVisible={showRescueSites}
              sites={sites}
              selectedSiteId={selectedSiteId}
              onSiteClick={handleSiteSelect}
            />

            {/* Incident markers — topmost z-index */}
            {incidents.filter(inc => inc.lat && inc.lng).map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <Marker
                  key={inc.id}
                  position={[inc.lat, inc.lng]}
                  icon={createCustomIcon(inc, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedIncidentId(inc.id);
                      setDetailMode('incident');
                      setMapCenterOverride(null);
                    },
                  }}
                  zIndexOffset={isSelected ? 1000 : 500}
                />
              );
            })}
          </MapContainer>
          </ErrorBoundary>

          {/* Map top bar */}
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-sm border border-slate-300 px-3 py-1.5 rounded shadow-sm text-slate-800 text-[11px] pointer-events-none">
            <div className="flex items-center gap-2">
              <MapIcon className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-bold tracking-wider uppercase">Active Tracking Region</span>
            </div>
          </div>

          {/* Map bottom legend */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur-sm border border-slate-300 px-3 py-1.5 rounded shadow-sm text-slate-800 text-[10px] flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />{t('common.critical', 'Critical')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c2410c]" />{t('common.high', 'High')}</span>
              <span className="flex items-center gap-1 border-l border-slate-300 pl-2"><span className="w-2 h-2 rounded-sm bg-purple-500" /> Pressure</span>
              <span className="flex items-center gap-1 border-l border-slate-300 pl-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Rescue Site</span>
            </div>
            <span className="text-slate-500 hidden sm:block">Click to inspect</span>
          </div>
        </div>

        {/* ── Right: Tabbed Detail Panel ──────────────────── */}
        <div className="bg-white border border-[#c6c6cd] rounded shadow-sm flex flex-col gap-3 pb-3">
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
          <div className="flex border-b border-[#f0edef]">
            {[
              { key: 'incident', label: 'Incident', color: 'border-[#2563eb]' },
              { key: 'pressure', label: 'Pressure', color: 'border-[#7c3aed]' },
              { key: 'sites', label: 'Sites', color: 'border-emerald-600' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setDetailMode(tab.key as any)}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  detailMode === tab.key
                    ? `text-[#1b1b1d] border-b-2 ${tab.color}`
                    : 'text-[#76777d] hover:text-[#1b1b1d]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto max-h-[380px]">
            <ErrorBoundary fallbackMessage="Detail panel encountered an error.">
            {/* ── INCIDENT TAB ────────────────────────────── */}
            {detailMode === 'incident' && (
              selectedIncident ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-[#f0edef] pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider font-mono block">ID: {selectedIncident.id}</span>
                      <h3 className="text-sm font-bold text-[#1b1b1d] leading-snug mt-0.5">{selectedIncident.title || 'SOS Report'}</h3>
                    </div>
                    <SeverityBadge severity={selectedIncident.severity} showIcon={false} />
                  </div>

                  <p className="text-xs text-[#45464d] leading-relaxed">{selectedIncident.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#f0edef] p-2 rounded border border-[#c6c6cd]">
                      <span className="block text-[9px] uppercase tracking-wider text-[#76777d] font-bold mb-1">Priority</span>
                      <span className="text-sm font-black text-[#0f172a]">{(selectedIncident.priority_score ?? 0).toFixed(1)}</span>
                    </div>
                    <div className="bg-[#f0edef] p-2 rounded border border-[#c6c6cd]">
                      <span className="block text-[9px] uppercase tracking-wider text-[#76777d] font-bold mb-1">Review</span>
                      <span className="text-sm font-black text-[#0f172a] uppercase">{selectedIncident.review_state || 'Unverified'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs bg-[#f6f3f5] p-2.5 rounded border border-[#c6c6cd]">
                    <div className="flex items-center justify-between text-[#45464d]">
                      <span>Status:</span>
                      <strong className="uppercase text-[#0f172a]">{selectedIncident.status}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#45464d]">
                      <span>Category:</span>
                      <strong className="capitalize text-[#0f172a]">{selectedIncident.category}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#45464d]">
                      <span>Zone:</span>
                      <strong className="font-mono text-[#0f172a]">{selectedIncident.zone_id}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[#45464d]">
                      <span>Reported:</span>
                      <span>{formatDate(selectedIncident.created_at)}</span>
                    </div>
                  </div>

                  {/* Rescue-site ranking trigger */}
                  {selectedIncident.lat && selectedIncident.lng ? (
                    <Button
                      variant="primary"
                      fullWidth
                      className="bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      onClick={() => { setRankingEnabled(true); setDetailMode('sites'); }}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Find Safe Rescue Sites</span>
                    </Button>
                  ) : (
                    <p className="text-[11px] text-[#76777d] text-center">Location unavailable — cannot rank sites</p>
                  )}

                  <Button
                    variant="primary"
                    fullWidth
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-2 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    onClick={() => navigate('/officer/dispatch')}
                  >
                    <Radio className="h-4 w-4" />
                    <span>{t('officer.liveMap.dispatchRescueUnit', 'Dispatch')}</span>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-10 text-[#76777d] text-xs">
                  {isLoadingIncidents ? 'Loading incidents...' : t('officer.liveMap.selectIncident', 'Select an incident')}
                </div>
              )
            )}

            {/* ── PRESSURE TAB ────────────────────────────── */}
            {detailMode === 'pressure' && (
              isLoadingPressure ? (
                <div className="text-center py-10 text-[#76777d] text-xs">Loading resource pressure...</div>
              ) : isErrorPressure ? (
                <div className="text-center py-10 text-red-600 text-xs">Resource pressure unavailable</div>
              ) : !selectedZonePressure ? (
                <div className="text-center py-10 text-[#76777d] text-xs space-y-2">
                  <Package className="h-6 w-6 mx-auto text-[#7c3aed]" />
                  <p className="font-semibold text-[#1b1b1d]">Select a zone</p>
                  <p>Click a zone on the map or risk list</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-[#f0edef] pb-2">
                    <div>
                      <span className="text-[9px] font-bold text-[#76777d] uppercase tracking-wider block">Zone</span>
                      <h3 className="text-sm font-bold text-[#1b1b1d]">{selectedZonePressure.name}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pressureStatusConfig[selectedZonePressure.overallStatus]?.badge ?? 'bg-slate-100 text-slate-600'}`}>
                      {pressureStatusConfig[selectedZonePressure.overallStatus]?.label ?? 'Unknown'}
                    </span>
                  </div>

                  {!selectedZonePressure.hasDemandData && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Demand data unavailable.</div>
                  )}
                  {!selectedZonePressure.hasSupplyData && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Supply data unavailable.</div>
                  )}

                  <div className="space-y-2">
                    {selectedZonePressure.categories.map(cat => {
                      const cfg = pressureStatusConfig[cat.status] ?? pressureStatusConfig.unknown;
                      return (
                        <div key={cat.category} className="bg-[#f6f3f5] border border-[#c6c6cd] rounded p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#1b1b1d] uppercase tracking-wide">{cat.category}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-[#45464d]">
                            <div><span className="block text-[9px] uppercase text-[#76777d] font-bold">Demand</span><strong className="text-[#0f172a]">{cat.demand !== null ? `${cat.demand} ${cat.unit}` : '—'}</strong></div>
                            <div><span className="block text-[9px] uppercase text-[#76777d] font-bold">Available</span><strong className="text-[#0f172a]">{cat.available !== null ? `${cat.available} ${cat.unit}` : '—'}</strong></div>
                            <div><span className="block text-[9px] uppercase text-[#76777d] font-bold">Gap</span><strong className={cat.gap !== null && cat.gap < 0 ? 'text-red-700' : 'text-emerald-700'}>{cat.gap !== null ? (cat.gap >= 0 ? `+${cat.gap}` : `${cat.gap}`) : '—'}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* ── SITES TAB ────────────────────────────────── */}
            {detailMode === 'sites' && (
              <div className="space-y-3">
                {/* Header with trigger/retry */}
                <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#1b1b1d] uppercase tracking-wider">Rescue Site Ranking</h3>
                    {selectedIncident && (
                      <p className="text-[10px] text-[#76777d] mt-0.5 truncate">For: {selectedIncident.title || selectedIncident.id}</p>
                    )}
                  </div>
                  {rankingEnabled && (
                    <button
                      onClick={() => refetchSites()}
                      className="text-[10px] text-[#2563eb] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  )}
                </div>

                {/* Not yet triggered */}
                {!rankingEnabled && (
                  <div className="text-center py-8 text-[#76777d] text-xs space-y-3">
                    <ShieldCheck className="h-8 w-8 mx-auto text-emerald-500" />
                    <p className="font-semibold text-[#1b1b1d]">No site rankings yet</p>
                    <p>Select an incident and click "Find Safe Rescue Sites"</p>
                    {selectedIncident?.lat && (
                      <Button
                        variant="primary"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white py-2 font-bold text-xs uppercase tracking-wider mx-auto"
                        onClick={() => setRankingEnabled(true)}
                      >
                        Find Rescue Sites
                      </Button>
                    )}
                  </div>
                )}

                {/* Loading */}
                {rankingEnabled && isLoadingSites && (
                  <div className="text-center py-8 text-[#76777d] text-xs space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Finding suitable rescue sites...</p>
                  </div>
                )}

                {/* Error */}
                {rankingEnabled && isErrorSites && !isLoadingSites && (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-red-600 font-semibold">Unable to load rescue-site recommendations.</p>
                    <button onClick={() => refetchSites()} className="text-xs text-[#2563eb] hover:underline flex items-center gap-1 mx-auto">
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                )}

                {/* Empty */}
                {rankingEnabled && !isLoadingSites && !isErrorSites && sites.length === 0 && (
                  <div className="text-center py-6 text-[#76777d] text-xs space-y-1">
                    <ShieldCheck className="h-6 w-6 mx-auto text-slate-400" />
                    <p className="font-semibold text-[#1b1b1d]">No suitable rescue sites found for this incident.</p>
                  </div>
                )}

                {/* Results */}
                {rankingEnabled && !isLoadingSites && !isErrorSites && sites.length > 0 && (
                  <div className="space-y-2">
                    {sites.map((site, idx) => {
                      const isSelected = selectedSiteId === site.id;
                      const aCfg = accessConfig[site.access_status] ?? accessConfig.accessible;
                      return (
                        <div
                          key={site.id}
                          onClick={() => handleSiteSelect(site.id)}
                          className={`p-3 rounded border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                              : 'bg-[#f6f3f5] border-[#c6c6cd] hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center ${
                                idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1b1b1d] truncate">{site.name}</p>
                                <p className="text-[10px] text-[#76777d] mt-0.5">
                                  Score: <strong className="text-emerald-700">{site.suitability_score.toFixed(2)}</strong>
                                  {' · '}
                                  {site.distance_km.toFixed(1)} km
                                </p>
                              </div>
                            </div>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${aCfg.cls}`}>
                              {aCfg.label}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-200 grid grid-cols-2 gap-1.5 text-[10px]">
                              <div className="bg-white rounded border border-[#c6c6cd] p-1.5">
                                <span className="block text-[9px] uppercase text-[#76777d] font-bold">Capacity</span>
                                <strong className="text-[#0f172a]">{site.capacity}</strong>
                              </div>
                              <div className="bg-white rounded border border-[#c6c6cd] p-1.5">
                                <span className="block text-[9px] uppercase text-[#76777d] font-bold">Available</span>
                                <strong className="text-emerald-700">{site.available_capacity}</strong>
                              </div>
                              <div className="bg-white rounded border border-[#c6c6cd] p-1.5">
                                <span className="block text-[9px] uppercase text-[#76777d] font-bold">Elevation</span>
                                <strong className="text-[#0f172a]">{site.elevation_m} m</strong>
                              </div>
                              <div className="bg-white rounded border border-[#c6c6cd] p-1.5">
                                <span className="block text-[9px] uppercase text-[#76777d] font-bold">Flood Margin</span>
                                <strong className="text-[#0f172a]">{site.predicted_flood_margin_m} m</strong>
                              </div>
                              {/* reason_breakdown from backend */}
                              {Object.keys(site.reason_breakdown).length > 0 && (
                                <div className="col-span-2 bg-white rounded border border-[#c6c6cd] p-1.5">
                                  <span className="block text-[9px] uppercase text-[#76777d] font-bold mb-1">Ranking Factors</span>
                                  <div className="space-y-0.5">
                                    {Object.entries(site.reason_breakdown).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="capitalize text-[#45464d]">{key.replace(/_/g, ' ')}</span>
                                        <strong className="text-[#0f172a]">{value}</strong>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            </ErrorBoundary>
          </div>
          </div>
          
          <div className="border-t border-[#f0edef] px-3.5 pt-3">
            <ActionBar 
              selectedEntityId={
                detailMode === 'incident' ? selectedIncidentId 
                : detailMode === 'sites' ? selectedSiteId 
                : selectedZoneId
              } 
              entityType={detailMode === 'sites' ? 'site' : detailMode === 'incident' ? 'incident' : 'dispatch'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
