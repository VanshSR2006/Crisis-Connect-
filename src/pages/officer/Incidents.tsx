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
  AlertTriangle,
  MapPin,
  FileText,
  ExternalLink,
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

  const filteredIncidents = incidents
    .filter((i) => {
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const matchesSearch =
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.zone_id || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSeverity && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.priority_score ?? 0) - (a.priority_score ?? 0);
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
        return 'bg-red-100 text-red-900 border border-red-300';
      case 'acknowledged':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'dispatched':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header Card with Background Image ────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/news/nepal_rescue.jpg"
          alt="Distress Incident Reports Queue"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>FIELD EMERGENCY QUEUE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('officer.incidents.title', 'Incident Command Queue')}
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              {!isLoadingIncidents && !isErrorIncidents ? (
                <>{incidents.length} {t('officer.incidents.totalReports', 'total reports')} · {incidents.filter((i) => i.status !== 'resolved').length} {t('officer.incidents.active', 'active')}</>
              ) : (
                <span>Synchronizing...</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['incidents'] })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 font-extrabold text-xs uppercase tracking-wider shadow-md backdrop-blur-md transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
              <span>Refresh Queue</span>
            </button>

            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg hidden sm:block">
              <span className="block text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
                {incidents.filter((i) => i.status !== 'resolved').length}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                Active Queue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('officer.incidents.searchIncidents', 'Search by ID, title, description, or zone...')}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex gap-1 overflow-x-auto shrink-0 shadow-xs">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex gap-1 overflow-x-auto shrink-0 shadow-xs">
          {severityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverityFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                severityFilter === opt.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout: Incident List + Detail Panel ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Incidents List */}
        <div className="lg:col-span-2 bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] min-h-[300px]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-100/90 to-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-xs">
                <FileText className="h-4 w-4 text-blue-700" />
              </div>
              <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider">
                Incident Reports Queue ({filteredIncidents.length})
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-200/80 max-h-[650px] overflow-y-auto">
            {filteredIncidents.map((incident, idx) => {
              const isSelected = incident.id === selectedIncident?.id;
              const priorityVal = incident.priority_score ?? 88.0;
              const verifiedStatus = incident.verification_status || 'UNVERIFIED';

              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`p-4 cursor-pointer transition-all duration-150 space-y-2.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-l-blue-600 shadow-inner'
                      : idx % 2 === 1 ? 'bg-slate-50/60 hover:bg-slate-100/80' : 'bg-white hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={incident.severity} showIcon={false} />
                        <h4 className="text-xs font-black text-slate-900 truncate">{incident.title}</h4>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 truncate mt-1">{incident.description}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black font-mono shadow-xs shrink-0 ${getStatusBadgeClass(incident.status)}`}>
                      {t(`common.${incident.status}`)}
                    </span>
                  </div>

                  {/* Bottom Row Badges & Metadata */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-700 font-bold">
                        ID: <strong className="text-slate-900">{incident.id.slice(0, 8)}</strong>
                      </span>
                      <span className="bg-blue-50 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-md font-mono font-extrabold shadow-xs">
                        PRIORITY: {priorityVal.toFixed(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-mono font-extrabold uppercase shadow-xs border ${
                        verifiedStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {verifiedStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{formatDate(incident.created_at)}</span>
                      <span className="font-extrabold text-slate-700">{incident.zone_id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Incident Detail Panel */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col justify-between space-y-4">
          {selectedIncident ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-[11px] font-black uppercase text-slate-500 font-mono tracking-wider">
                  REF ID: {selectedIncident.id}
                </span>
                <SeverityBadge severity={selectedIncident.severity} showIcon={false} />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">{selectedIncident.title}</h3>
              </div>

              {/* Report Overview Box */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  REPORT OVERVIEW
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Priority & Credibility Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">BACKEND PRIORITY</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {(selectedIncident.priority_score ?? 88.0).toFixed(1)}
                  </span>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">CREDIBILITY</span>
                  <span className="text-base font-black text-slate-900 font-mono">1.00</span>
                </div>
              </div>

              {/* Update Status Protocol & OPEN DISPATCH PANEL */}
              <div className="space-y-2.5 pt-1 border-t border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  UPDATE STATUS PROTOCOL
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'acknowledged')}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all border border-slate-300 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Acknowledge</span>
                  </button>
                  <button
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                    className="px-3 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all border border-emerald-300 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Mark Resolved</span>
                  </button>

                  {/* Prominent OPEN DISPATCH PANEL Action Button */}
                  <button
                    onClick={() => {
                      setSelectedIncidentId(selectedIncident.id);
                      navigate('/officer/dispatch');
                    }}
                    className="col-span-2 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md border border-slate-700 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    <Radio className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span>OPEN DISPATCH PANEL</span>
                  </button>
                </div>
              </div>

              {/* Incident Metadata Details */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Zone:</span>
                  <strong className="text-slate-900 font-mono">{selectedIncident.zone_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <strong className="text-slate-900 uppercase font-mono">{selectedIncident.category}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GPS Lat/Lng:</span>
                  <strong className="text-slate-900 font-mono">{selectedIncident.lat?.toFixed(4)}, {selectedIncident.lng?.toFixed(4)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Logged Timestamp:</span>
                  <strong className="text-slate-900">{formatDate(selectedIncident.created_at)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              Select an incident from the queue to view details and open dispatch panel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
