import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useOfficerContext } from '@/lib/officerContext';
import { getVolunteers } from '@/lib/api/users';
import { Button } from '@/components/ui/Button';
import { Radio, CheckCircle, Loader2, Navigation, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const Dispatch: React.FC = () => {
  const { t } = useTranslation();
  const { incidents, dispatches, resources, createDispatch, selectedIncidentId } =
    useOfficerContext();

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  const [targetIncidentId, setTargetIncidentId] = useState<string>(
    selectedIncidentId || activeIncidents[0]?.id || ''
  );
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[0]?.id || '');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCount = dispatches.filter((d) => d.status !== 'completed').length;
  const completedCount = dispatches.filter((d) => d.status === 'completed').length;

  const { data: volunteerUsers = [] } = useQuery({
    queryKey: ['dispatch-volunteers'],
    queryFn: getVolunteers,
  });

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncidentId || !assignedUserId) return;

    const selectedResource = resources.find((r) => r.id === selectedResourceId);
    const selectedUser = volunteerUsers.find((u) => u.id === assignedUserId);

    const fullNotes = dispatchNotes
      ? dispatchNotes
      : `Deployed ${selectedResource?.name || 'Emergency Team'} under leadership of ${
          selectedUser?.name || assignedUserId
        }.`;

    const dispatch = await createDispatch({
      incidentId: targetIncidentId,
      assignedUserId,
      resourceId: selectedResourceId || undefined,
      notes: fullNotes,
    });

    if (!dispatch) return;

    setSuccessMessage(`Dispatch order #${dispatch.id} created successfully!`);
    setDispatchNotes('');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Card with Background Image ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        <img
          src="/resource_stock_bg.jpg"
          alt="Resource & Unit Dispatch Center"
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 text-white">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>FIELD DISPATCH COMMAND</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              Resource & Unit Dispatch Center
            </h1>
            <p className="text-xs font-medium text-slate-300 drop-shadow-xs">
              {activeCount} active deployments · {completedCount} completed rescue missions
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl px-5 py-3 text-center shadow-lg">
              <span className="block text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
                {activeCount}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                Active Deployments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-900 text-white rounded-2xl p-4 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn border border-emerald-700">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Top 2-Column Section ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) - Issue Dispatch Form */}
        <div className="lg:col-span-2 bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
            <Navigation className="h-4 w-4 text-rose-600 transform rotate-45" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              ISSUE EMERGENCY DISPATCH COMMAND
            </h2>
          </div>

          <form onSubmit={handleDispatchSubmit} className="space-y-4">
            {/* Target Incident */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Target Incident <span className="text-rose-600">*</span>
              </label>
              <select
                value={targetIncidentId}
                onChange={(e) => setTargetIncidentId(e.target.value)}
                className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all shadow-inner"
              >
                <option value="">Select target emergency incident...</option>
                {activeIncidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.id}] {i.title} ({i.severity.toUpperCase()} · {i.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Inline 2-Column Row for Resource & Leader */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Assign Resource Stock
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all shadow-inner"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.available_quantity ?? r.quantity} units - {r.available_quantity === 0 ? 'DISPATCHED' : 'AVAILABLE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Assigned Team Leader / Unit
                </label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all shadow-inner"
                >
                  <option value="">Select volunteer</option>
                  {volunteerUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role ? u.role.toUpperCase() : 'VOLUNTEER'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tactical Directives */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Dispatch Directives & Tactical Notes
              </label>
              <textarea
                rows={3}
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Enter deployment instructions..."
                className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Coral / Emergency Action Button */}
            <Button
              type="submit"
              disabled={!targetIncidentId || !assignedUserId}
              className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 active:from-rose-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[0_6px_16px_rgba(244,63,94,0.35)] transition-all border border-rose-400/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Radio className="h-4 w-4 animate-pulse" />
              CONFIRM & DISPATCH RESCUE TEAM NOW
            </Button>
          </form>
        </div>

        {/* Right Column (1/3 width) - Available Stock & Personnel */}
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Package className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              AVAILABLE STOCK & PERSONNEL
            </h2>
          </div>

          <div className="space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-1 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 leading-tight">
                    {r.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                    {r.available_quantity ?? r.quantity} units
                  </span>
                </div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {r.category || 'RESOURCE'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Full-Width Section - Live Dispatch Queue ─── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-600 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              LIVE DISPATCH QUEUE ({dispatches.length})
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Real-time Sync
          </span>
        </div>

        <div className="divide-y divide-slate-200/80">
          {dispatches.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              No active dispatch orders in queue.
            </div>
          ) : (
            dispatches.map((d, idx) => {
              const isCompleted = d.status === 'completed';
              return (
                <div
                  key={d.id}
                  className={`p-4 space-y-2.5 transition-colors ${
                    idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-black text-slate-900">Dispatch Order #{d.id}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Target: Incident{' '}
                        <span className="text-slate-700 font-mono font-bold">
                          #{d.incident_id}
                        </span>
                      </span>
                    </div>
                    <span
                      className={`self-start sm:self-auto px-3 py-1 rounded-xl text-[10px] uppercase font-black font-mono shadow-xs flex items-center gap-1.5 border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                      )}
                      {isCompleted ? 'COMPLETED' : 'EN ROUTE'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-700">
                    {d.notes || 'Emergency dispatch order issued.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                    <span>
                      Assigned Lead:{' '}
                      <strong className="text-slate-800 font-mono font-bold">
                        {d.assigned_user_id}
                      </strong>
                    </span>
                    <span className="font-mono">Dispatched: {formatDate(d.dispatched_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
