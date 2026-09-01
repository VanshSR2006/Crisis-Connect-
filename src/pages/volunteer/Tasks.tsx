import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVolunteerContext } from '@/lib/volunteerContext';
import { CheckCircle, Clock, Loader2, AlertCircle, RefreshCw, MapPin, Navigation, Check, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Tasks: React.FC = () => {
  const { t } = useTranslation();
  const {
    tasks,
    isLoading,
    error,
    activeActionTaskId,
    markArrived,
    markResolved,
    refreshTasks,
    clearError,
  } = useVolunteerContext();

  const pendingCount = tasks.filter((t) => (t.status as string) !== 'completed' && (t.status as string) !== 'resolved').length;
  const completedCount = tasks.filter((t) => (t.status as string) === 'completed' || (t.status as string) === 'resolved').length;

  return (
    <div className="space-y-5">
      {/* ── Page Header & Progress Status Card with Background Image ─────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        {/* Background Image related to volunteer field tasks */}
        <img
          src="/volunteer_header_bg.jpg"
          alt="Volunteer Field Operations"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] filter brightness-[0.88] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        {/* Soft Dark Gradient Overlay for Maximum Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/70 pointer-events-none" />

        {/* Header Content Overlay */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>FIELD DISPATCH UNITS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('volunteer.tasks.title')}
            </h1>
            <p className="text-xs font-semibold text-slate-300 drop-shadow-xs flex items-center gap-2">
              <span>{pendingCount} {t('volunteer.tasks.pendingFieldTasks')}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{completedCount} {t('volunteer.tasks.completed')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Elevated Progress Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-4 py-2 text-center shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                {t('volunteer.tasks.progress')}
              </span>
              <span className="text-sm font-black text-emerald-400 drop-shadow-xs font-mono">
                {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% {t('volunteer.tasks.done')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-600 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => refreshTasks()}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-extrabold text-[11px] uppercase tracking-wider shadow-xs"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="px-2 py-1 text-red-700 hover:text-red-900 font-black text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Task Cards List ───────────────────────────────── */}
      {isLoading && tasks.length === 0 ? (
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb] mx-auto" />
          <p className="text-xs text-slate-700 uppercase tracking-wider font-extrabold">
            Loading field assignment tasks from backend...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
          <div className="p-3 bg-slate-100 rounded-2xl shadow-inner w-12 h-12 mx-auto flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-black text-[#1b1b1d]">No Active Field Missions Assigned</h3>
          <p className="text-xs font-semibold text-slate-500">
            You have no active emergency dispatches assigned to your team profile right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...tasks]
            .sort((a, b) => {
              const timeA = a.dispatched_at ? new Date(a.dispatched_at).getTime() : (a.incident?.created_at ? new Date(a.incident.created_at).getTime() : 0);
              const timeB = b.dispatched_at ? new Date(b.dispatched_at).getTime() : (b.incident?.created_at ? new Date(b.incident.created_at).getTime() : 0);
              return timeB - timeA;
            })
            .map((task) => {
              const statusStr = task.status as string;
              const isCompleted = statusStr === 'completed' || statusStr === 'resolved';
              const isOnSite = statusStr === 'on_site' || statusStr === 'arrived';
              const isActionLoading = activeActionTaskId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl p-5 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12),0_4px_10px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_45px_-10px_rgba(0,0,0,0.22)] hover:-translate-y-1.5 hover:scale-[1.01] motion-reduce:hover:transform-none transition-all duration-200 ease-out space-y-3.5"
              >
                {/* Header Row: Field Order # & Raised Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black text-[#1b1b1d] tracking-wide drop-shadow-xs">
                        {t('volunteer.tasks.fieldOrder')} #{task.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold bg-blue-50 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-lg shadow-xs">
                        Inc: {task.incident_id.slice(0, 8)}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-1">
                      {task.incident?.title || `Emergency ${task.incident?.category || 'Rescue'} Request`}
                    </h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 shadow-xs border ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-emerald-900/10'
                        : isOnSite
                        ? 'bg-blue-100 text-blue-900 border-blue-300 shadow-blue-900/10'
                        : 'bg-amber-100 text-amber-900 border-amber-300 shadow-amber-900/10'
                    }`}
                  >
                    {isCompleted ? 'Resolved' : isOnSite ? 'Arrived On Site' : 'En Route / Assigned'}
                  </span>
                </div>

                {/* Location Row — Elevated Info Strip */}
                <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#2563eb] flex-shrink-0" />
                    <span className="font-extrabold text-slate-900 font-mono">
                      LAT: {task.incident?.lat?.toFixed(4) || '24.8200'} · LNG: {task.incident?.lng?.toFixed(4) || '92.7900'} ({task.incident?.zone_id || 'z-silchar'})
                    </span>
                  </div>
                </div>

                {/* Description Box — Recessed Area with Inset Shadow Depth */}
                <p className="text-xs font-extrabold text-slate-900 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                  {task.incident?.description || task.notes || 'Emergency assistance requested.'}
                </p>

                {/* Bottom Footer: Unit Assignment & 3D Tactile Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      {t('volunteer.tasks.assignedToUnit')}: <strong className="text-slate-900">{task.assigned_user_id || 'Unassigned'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isOnSite && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isActionLoading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs h-9 px-4 font-black uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0.5 motion-reduce:hover:transform-none transition-all duration-150 border border-blue-400/30"
                        onClick={() => markArrived(task.id)}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Navigation className="h-3.5 w-3.5" />
                        )}
                        <span>{isActionLoading ? 'Updating...' : 'Mark Arrived on Scene'}</span>
                      </Button>
                    )}

                    {!isCompleted && isOnSite && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isActionLoading}
                        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs h-9 px-4 font-black uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0.5 motion-reduce:hover:transform-none transition-all duration-150 border border-emerald-400/40"
                        onClick={() => markResolved(task.id)}
                      >
                        {isActionLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{isActionLoading ? 'Updating...' : 'Mark Mission Resolved'}</span>
                      </Button>
                    )}

                    {isCompleted && (
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                        <Check className="h-4 w-4 text-emerald-700" />
                        Mission Complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
