import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useOfficerContext } from '@/lib/officerContext';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { IncidentStatus, SeverityLevel } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Radio,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type StatusFilter = 'all' | IncidentStatus;
type SeverityFilter = 'all' | SeverityLevel;

export const Incidents: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { 
    incidents, 
    isLoadingIncidents, 
    isErrorIncidents, 
    selectedIncidentId, 
    setSelectedIncidentId, 
    updateIncidentStatus 
  } = useOfficerContext();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIncidents = incidents.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.zone_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || (filteredIncidents.length > 0 ? filteredIncidents[0] : null);

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: t('officer.incidents.allStatuses', 'All Statuses'), value: 'all' },
    { label: t('common.reported', 'Reported'), value: 'reported' },
    { label: t('common.acknowledged', 'Acknowledged'), value: 'acknowledged' },
    { label: t('officer.liveMap.dispatched', 'Dispatched'), value: 'dispatched' },
    { label: t('common.resolved', 'Resolved'), value: 'resolved' },
  ];

  const severityOptions: { label: string; value: SeverityFilter }[] = [
    { label: t('officer.incidents.allSeverity', 'All Severity'), value: 'all' },
    { label: t('common.critical', 'Critical'), value: 'critical' },
    { label: t('common.high', 'High'), value: 'high' },
    { label: t('common.medium', 'Medium'), value: 'medium' },
    { label: t('common.low', 'Low'), value: 'low' },
  ];

  const getStatusBadgeClass = (status: IncidentStatus) => {
    switch (status) {
      case 'reported':
        return 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]';
      case 'acknowledged':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'dispatched':
        return 'bg-[#d5e3fc] text-[#57657a] border border-[#b9c7df]';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      default:
        return 'bg-[#eae7e9] text-[#45464d] border border-[#c6c6cd]';
    }
  };

  const getReviewBadgeClass = (state?: string) => {
    switch (state) {
      case 'verified': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      case 'flagged': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-slate-600 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.incidents.title', 'Live Incident Queue')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {!isLoadingIncidents && !isErrorIncidents ? (
              <>{incidents.length} {t('officer.incidents.totalReports', 'total reports')} · {incidents.filter((i) => i.status !== 'resolved').length} {t('officer.incidents.active', 'active')}</>
            ) : (
              <span>Synchronizing...</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#76777d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('officer.incidents.searchIncidents', 'Search incidents...')}
            className="w-full text-xs pl-9 pr-3 py-2 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>
        <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto shrink-0">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${statusFilter === opt.value ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eae7e9]'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto shrink-0">
          {severityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverityFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${severityFilter === opt.value ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eae7e9]'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout: Incident List + Detail Panel ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side: Incidents List */}
        <div className="lg:col-span-2 bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm relative min-h-[300px]">
          {isLoadingIncidents ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#45464d]">
              <RefreshCw className="h-6 w-6 animate-spin text-[#2563eb] mb-2" />
              <span className="text-xs font-semibold uppercase tracking-widest">Loading live incidents...</span>
            </div>
          ) : isErrorIncidents ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#93000a]">
              <AlertOctagon className="h-8 w-8 mb-2 opacity-80" />
              <span className="text-sm font-bold uppercase mb-3">Unable to load incidents</span>
              <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['incidents'] })}>
                Retry
              </Button>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-[#76777d] text-xs font-medium">
              No active incidents
            </div>
          ) : (
            <div className="divide-y divide-[#f0edef] max-h-[75vh] overflow-y-auto">
              {filteredIncidents.map((incident, idx) => {
                const isSelected = selectedIncident?.id === incident.id;

                return (
                  <div
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          document.getElementById('incident-detail-panel')?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }
                    }}
                    className={`px-3.5 py-3 cursor-pointer transition-colors ${isSelected
                        ? 'bg-[#d5e3fc]/70 border-l-4 border-l-[#2563eb]'
                        : idx % 2 === 1
                          ? 'bg-[#f6f3f5]'
                          : 'bg-white'
                      } ${!isSelected && incident.severity === 'critical' ? 'border-l-2 border-l-[#ba1a1a]' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <SeverityBadge severity={incident.severity} showIcon={false} />
                        <span className="text-[13px] font-bold text-[#1b1b1d] leading-snug">
                          {incident.title || 'SOS Report'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${getStatusBadgeClass(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#45464d] leading-relaxed line-clamp-2 mb-2">
                      {incident.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-semibold text-[#76777d] border-t border-[#f0edef] pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#0f172a]">ID: {incident.id.slice(-6)}</span>
                        <span>·</span>
                        <span className="uppercase text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          PRIORITY: {(incident.priority_score ?? 0).toFixed(1)}
                        </span>
                        {incident.review_state && (
                          <span className={`uppercase px-1.5 py-0.5 rounded border ${getReviewBadgeClass(incident.review_state)}`}>
                            {incident.review_state}
                          </span>
                        )}
                      </div>
                      <span className="font-mono">{incident.zone_id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Incident Detail Panel */}
        <div id="incident-detail-panel" className="bg-white border border-[#c6c6cd] rounded p-4 space-y-4 shadow-sm h-fit sticky top-20">
          {selectedIncident ? (
            <div className="space-y-4">
              <div className="border-b border-[#f0edef] pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider font-mono">
                    Ref ID: {selectedIncident.id}
                  </span>
                  <SeverityBadge severity={selectedIncident.severity} showIcon={false} />
                </div>
                <h3 className="text-base font-bold text-[#1b1b1d]">{selectedIncident.title || 'SOS Report'}</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] block">
                  {t('officer.incidents.reportOverview', 'Report Overview')}
                </label>
                <p className="text-xs text-[#45464d] bg-[#f6f3f5] p-3 rounded border border-[#c6c6cd] leading-relaxed">
                  {selectedIncident.description || 'No additional details provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                 <div className="bg-[#f0edef] p-2 rounded border border-[#c6c6cd]">
                   <span className="block text-[9px] uppercase tracking-wider text-[#76777d] font-bold mb-1">Backend Priority</span>
                   <span className="text-sm font-black text-[#0f172a]">{(selectedIncident.priority_score ?? 0).toFixed(1)}</span>
                 </div>
                 <div className="bg-[#f0edef] p-2 rounded border border-[#c6c6cd]">
                   <span className="block text-[9px] uppercase tracking-wider text-[#76777d] font-bold mb-1">Credibility</span>
                   <span className="text-sm font-black text-[#0f172a]">{(selectedIncident.credibility_score ?? 1).toFixed(2)}</span>
                 </div>
              </div>

              {/* Status Update Quick Actions */}
              <div className="space-y-2 border-t border-[#f0edef] pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] block">
                  {t('officer.incidents.updateStatusProtocol', 'Update Status Protocol')}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#c6c6cd]"
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'acknowledged')}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{t('officer.incidents.acknowledge', 'Acknowledge')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    <span>{t('officer.incidents.markResolved', 'Resolve')}</span>
                  </Button>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                  onClick={() => navigate('/officer/dispatch')}
                >
                  <Radio className="h-4 w-4" />
                  <span>{t('officer.incidents.openDispatchPanel', 'Open Dispatch Panel')}</span>
                </Button>
              </div>

              <div className="border-t border-[#f0edef] pt-3 text-[11px] text-[#76777d] space-y-1">
                <div className="flex justify-between">
                  <span>{t('citizen.profile.zone', 'Zone')}:</span>
                  <strong className="font-mono text-[#1b1b1d]">{selectedIncident.zone_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <strong className="text-[#1b1b1d] uppercase">{selectedIncident.category}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('officer.incidents.gpsLatLng', 'GPS Coordinates')}:</span>
                  {selectedIncident.lat !== undefined && selectedIncident.lng !== undefined ? (
                    <strong className="font-mono text-[#1b1b1d]">
                      {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}
                    </strong>
                  ) : (
                     <strong className="text-amber-600">Location unavailable</strong>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>{t('officer.incidents.loggedTimestamp', 'Logged')}:</span>
                  <span>{formatDate(selectedIncident.created_at)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#76777d] text-xs">
              {isLoadingIncidents ? 'Loading details...' : 'Select an incident from the list to view details.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
