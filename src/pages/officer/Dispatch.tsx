import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfficerContext } from '@/lib/officerContext';
import { mockUsers } from '@/mocks';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { Radio, UserCheck, Clock, CheckCircle, Loader2, Send, Package, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const Dispatch: React.FC = () => {
  const { t } = useTranslation();
  const { incidents, dispatches, resources, createDispatch, selectedIncidentId, setSelectedIncidentId } =
    useOfficerContext();

  const [targetIncidentId, setTargetIncidentId] = useState<string>(
    selectedIncidentId || incidents[0]?.id || ''
  );
  const [assignedUserId, setAssignedUserId] = useState<string>('usr-003');
  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[0]?.id || '');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCount = dispatches.filter((d) => d.status !== 'completed').length;
  const completedCount = dispatches.filter((d) => d.status === 'completed').length;

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const volunteerUsers = mockUsers.filter((u) => u.role === 'volunteer' || u.role === 'officer');

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId) return;

    const selectedResource = resources.find((r) => r.id === selectedResourceId);
    const selectedUser = mockUsers.find((u) => u.id === assignedUserId);

    const fullNotes = dispatchNotes
      ? `${dispatchNotes} (Assigned unit: ${selectedUser?.name || assignedUserId}, Resource: ${
          selectedResource?.name || 'Standard Equipment'
        })`
      : `Deployed ${selectedResource?.name || 'Emergency Team'} under leadership of ${
          selectedUser?.name || assignedUserId
        }.`;

    createDispatch({
      incidentId: targetIncidentId,
      assignedUserId,
      notes: fullNotes,
    });

    setSuccessMessage(`Dispatch order issued for Incident #${targetIncidentId}!`);
    setDispatchNotes('');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const getStatusConfig = (status: string) => {
    if (status === 'completed') {
      return {
        label: t('common.completed'),
        icon: CheckCircle,
        classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      };
    }
    return {
      label: t('officer.dispatch.enRoute'),
      icon: Loader2,
      classes: 'bg-[#d5e3fc] text-[#57657a] border border-[#b9c7df]',
    };
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('officer.dispatch.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {activeCount} {t('officer.dispatch.activeDeployments')} · {completedCount} {t('officer.dispatch.completedMissions')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#45464d]">
          <Radio className="h-3.5 w-3.5 text-[#2563eb] animate-pulse" />
          <span>{t('officer.dispatch.radioChannelActive')}</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-900 text-white rounded p-3 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Dispatch Form & Active Resource Grid ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Issue New Dispatch Order */}
        <div className="lg:col-span-2 bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f0edef] pb-2">
            <Send className="h-4 w-4 text-[#ba1a1a]" />
            <h2 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
              {t('officer.dispatch.issueEmergencyCommand')}
            </h2>
          </div>

          <form onSubmit={handleDispatchSubmit} className="space-y-3">
            {/* Target Incident Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
                {t('officer.dispatch.targetIncident')} <span className="text-red-600">*</span>
              </label>
              <select
                value={targetIncidentId}
                onChange={(e) => {
                  setTargetIncidentId(e.target.value);
                  setSelectedIncidentId(e.target.value);
                }}
                className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.id}] {inc.title} ({inc.severity.toUpperCase()} · {inc.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Resource & Volunteer Lead */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
                  {t('officer.dispatch.assignResourceStock')}
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                >
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {t(`resources.names.${res.name}`, { defaultValue: res.name })} ({res.quantity} {t(`resources.units.${res.unit}`, { defaultValue: res.unit })} - {String(res.status).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
                  {t('officer.dispatch.assignedTeamLeader')}
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                >
                  {volunteerUsers.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.name} ({usr.role.toUpperCase()} · {usr.zone_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dispatch Operational Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#1b1b1d] mb-1">
                {t('officer.dispatch.dispatchDirectives')}
              </label>
              <textarea
                rows={3}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder={t('officer.dispatch.enterInstructions')}
                className="w-full text-xs p-2.5 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            <Button
              type="submit"
              variant="danger"
              fullWidth
              size="lg"
              className="bg-[#ba1a1a] hover:bg-[#991b1b] text-white font-black text-xs uppercase tracking-widest py-3 rounded shadow-sm flex items-center justify-center gap-2"
            >
              <Radio className="h-4 w-4" />
              <span>{t('officer.dispatch.confirmDispatch')}</span>
            </Button>
          </form>
        </div>

        {/* Right 1 Col: Stock & Available Teams Overview */}
        <div className="bg-white border border-[#c6c6cd] rounded p-4 shadow-sm space-y-3 h-fit">
          <div className="flex items-center gap-2 border-b border-[#f0edef] pb-2">
            <Package className="h-4 w-4 text-[#2563eb]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
              {t('officer.dispatch.availableStockPersonnel')}
            </h3>
          </div>

          <div className="space-y-2">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-2.5 rounded bg-[#f6f3f5] border border-[#c6c6cd] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-[#1b1b1d] block">
                    {t(`resources.names.${res.name}`, { defaultValue: res.name })}
                  </span>
                  <span className="text-[10px] text-[#76777d] uppercase">{res.category}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {res.quantity} {t(`resources.units.${res.unit}`, { defaultValue: res.unit })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Dispatch Orders Feed ───────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
        <div className="px-3 py-2 border-b border-[#c6c6cd] flex items-center justify-between bg-[#f0edef]">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#0f172a]" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1b1b1d]">
              {t('officer.dispatch.liveDispatchQueue')} ({dispatches.length})
            </span>
          </div>
          <span className="text-[11px] text-[#76777d] font-mono">{t('officer.dispatch.realtimeSync')}</span>
        </div>

        <div className="divide-y divide-[#f0edef]">
          {dispatches.map((dispatch, idx) => {
            const statusConfig = getStatusConfig(dispatch.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={dispatch.id}
                className={`px-3 py-3 hover:bg-[#f6f3f5] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <span className="text-[13px] font-bold text-[#1b1b1d]">
                      Dispatch Order #{dispatch.id}
                    </span>
                    <span className="ml-2 text-[11px] text-[#76777d] font-mono">
                      Target: Incident #{dispatch.incident_id}
                    </span>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${statusConfig.classes}`}
                  >
                    <StatusIcon
                      className={`h-3 w-3 ${dispatch.status !== 'completed' ? 'animate-spin' : ''}`}
                    />
                    {statusConfig.label}
                  </span>
                </div>

                <p className="text-[13px] text-[#45464d] leading-[18px] mb-2">{dispatch.notes}</p>

                <div className="flex items-center gap-4 text-[11px] text-[#76777d] border-t border-[#f0edef] pt-2">
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    <span>{t('officer.dispatch.assignedLead')}: {dispatch.assigned_user_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{t('officer.liveMap.dispatched')}: {formatDate(dispatch.dispatched_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
