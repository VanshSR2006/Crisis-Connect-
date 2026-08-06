import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOfficerContext } from '@/lib/officerContext';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { IncidentStatus, SeverityLevel } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  MapPin,
  Search,
  Radio,
  CheckCircle,
  Clock,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type StatusFilter = 'all' | IncidentStatus;
type SeverityFilter = 'all' | SeverityLevel;

export const Incidents: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { incidents, selectedIncidentId, setSelectedIncidentId, updateIncidentStatus } = useOfficerContext();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIncidents = incidents.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.zone_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || filteredIncidents[0] || null;

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: t('officer.incidents.allStatuses'), value: 'all' },
    { label: t('common.reported'), value: 'reported' },
    { label: t('common.acknowledged'), value: 'acknowledged' },
    { label: t('officer.liveMap.dispatched'), value: 'dispatched' },
    { label: t('common.resolved'), value: 'resolved' },
  ];

  const severityOptions: { label: string; value: SeverityFilter }[] = [
    { label: t('officer.incidents.allSeverity'), value: 'all' },
    { label: t('common.critical'), value: 'critical' },
    { label: t('common.high'), value: 'high' },
    { label: t('common.medium'), value: 'medium' },
    { label: t('common.low'), value: 'low' },
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

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.incidents.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {incidents.length} {t('officer.incidents.totalReports')} · {incidents.filter((i) => i.status !== 'resolved').length} {t('officer.incidents.active')}
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#76777d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('officer.incidents.searchIncidents')}
            className="w-full text-xs pl-9 pr-3 py-2 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>

        {/* Status Filters */}
        <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto shrink-0">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${
                statusFilter === opt.value ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eae7e9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Severity Filters */}
        <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto shrink-0">
          {severityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverityFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${
                severityFilter === opt.value ? 'bg-[#0f172a] text-white' : 'text-[#45464d] hover:bg-[#eae7e9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout: Incident List + Detail Panel ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Incidents List (Zebra Striped) */}
        <div className="lg:col-span-2 bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-[#76777d] text-xs font-medium">
              {t('officer.incidents.noIncidentsMatch')}
            </div>
          ) : (
            <div className="divide-y divide-[#f0edef]">
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
                    className={`px-3.5 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#d5e3fc]/70 border-l-4 border-l-[#2563eb]'
                        : idx % 2 === 1
                        ? 'bg-[#f6f3f5]'
                        : 'bg-white'
                    } ${
                      !isSelected && incident.severity === 'critical' ? 'border-l-2 border-l-[#ba1a1a]' : ''
                    }`}
                  >
                    {/* Row 1: Severity + Title + Status */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <SeverityBadge severity={incident.severity} showIcon={false} />
                        <span className="text-[13px] font-bold text-[#1b1b1d] leading-snug">
                          {incident.title}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${getStatusBadgeClass(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </div>

                    {/* Row 2: Description */}
                    <p className="text-[12px] text-[#45464d] leading-relaxed line-clamp-2 mb-2">
                      {incident.description}
                    </p>

                    {/* Row 3: Footer Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-[#76777d] border-t border-[#f0edef] pt-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#0f172a]">ID: {incident.id}</span>
                        <span>·</span>
                        <span className="uppercase font-medium">{incident.category}</span>
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
        <div id="incident-detail-panel" className="bg-white border border-[#c6c6cd] rounded p-4 space-y-4 shadow-sm h-fit">
          {selectedIncident ? (
            <div className="space-y-4">
              <div className="border-b border-[#f0edef] pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider font-mono">
                    Reference ID: {selectedIncident.id}
                  </span>
                  <SeverityBadge severity={selectedIncident.severity} showIcon={false} />
                </div>
                <h3 className="text-base font-bold text-[#1b1b1d]">{selectedIncident.title}</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] block">
                  {t('officer.incidents.reportOverview')}
                </label>
                <p className="text-xs text-[#45464d] bg-[#f6f3f5] p-3 rounded border border-[#c6c6cd] leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Status Update Quick Actions */}
              <div className="space-y-2 border-t border-[#f0edef] pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#76777d] block">
                  {t('officer.incidents.updateStatusProtocol')}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#c6c6cd]"
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'acknowledged')}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{t('officer.incidents.acknowledge')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    <span>{t('officer.incidents.markResolved')}</span>
                  </Button>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                  onClick={() => navigate('/officer/dispatch')}
                >
                  <Radio className="h-4 w-4" />
                  <span>{t('officer.incidents.openDispatchPanel')}</span>
                </Button>
              </div>

              <div className="border-t border-[#f0edef] pt-3 text-[11px] text-[#76777d] space-y-1">
                <div className="flex justify-between">
                  <span>{t('citizen.profile.zone')}:</span>
                  <strong className="font-mono text-[#1b1b1d]">{selectedIncident.zone_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('officer.incidents.gpsLatLng')}:</span>
                  <strong className="font-mono text-[#1b1b1d]">
                    {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('officer.incidents.loggedTimestamp')}:</span>
                  <span>{formatDate(selectedIncident.created_at)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#76777d] text-xs">
              {t('officer.incidents.selectFromList')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
