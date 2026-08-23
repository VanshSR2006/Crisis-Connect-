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
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('volunteer.tasks.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {pendingCount} {t('volunteer.tasks.pendingFieldTasks')} · {completedCount} {t('volunteer.tasks.completed')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshTasks()}
            disabled={isLoading}
            className="p-2 bg-white border border-[#c6c6cd] hover:bg-[#f6f3f5] rounded text-[#45464d] transition-colors"
            title="Refresh Tasks"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-white border border-[#c6c6cd] rounded px-3 py-1.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#45464d] block">
              {t('volunteer.tasks.progress')}
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% {t('volunteer.tasks.done')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 rounded p-3 text-xs flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => refreshTasks()}
              className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-semibold text-[11px] uppercase tracking-wider"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="px-1.5 py-0.5 text-red-600 hover:text-red-800 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Task Cards List ───────────────────────────────── */}
      {isLoading && tasks.length === 0 ? (
        <div className="bg-white border border-[#c6c6cd] rounded p-8 text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#2563eb] mx-auto" />
          <p className="text-xs text-[#45464d] uppercase tracking-wider font-semibold">
            Loading field assignment tasks from backend...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-[#c6c6cd] rounded p-8 text-center space-y-2">
          <ClipboardList className="h-8 w-8 text-[#76777d] mx-auto" />
          <h3 className="text-sm font-bold text-[#1b1b1d]">No Active Field Missions Assigned</h3>
          <p className="text-xs text-[#45464d]">
            You have no active emergency dispatches assigned to your team profile right now.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm">
          <div className="divide-y divide-[#f0edef]">
            {tasks.map((task, idx) => {
              const statusStr = task.status as string;
              const isCompleted = statusStr === 'completed' || statusStr === 'resolved';
              const isOnSite = statusStr === 'on_site' || statusStr === 'arrived';
              const isActionLoading = activeActionTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`px-4 py-3.5 hover:bg-[#f6f3f5] transition-colors ${
                    idx % 2 === 1 ? 'bg-[#fcf8fa]' : 'bg-white'
                  }`}
                >
                  {/* Top Bar: Order ID & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-[#1b1b1d]">
                          {t('volunteer.tasks.fieldOrder')} #{task.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                          Inc: {task.incident_id.slice(0, 8)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#1b1b1d] mt-1">
                        {task.incident?.title || `Emergency ${task.incident?.category || 'Rescue'} Request`}
                      </h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isOnSite
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isCompleted ? 'Resolved' : isOnSite ? 'Arrived On Site' : 'En Route / Assigned'}
                    </span>
                  </div>

                  {/* Location & Details */}
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-[#45464d] flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#2563eb] flex-shrink-0" />
                      <span className="font-semibold text-[#1b1b1d]">
                        LAT: {task.incident?.lat?.toFixed(4) || '24.8200'} · LNG: {task.incident?.lng?.toFixed(4) || '92.7900'} ({task.incident?.zone_id || 'z-silchar'})
                      </span>
                    </p>
                    <p className="text-[12px] text-[#45464d] leading-relaxed bg-[#f6f3f5] p-2 rounded border border-[#e5e5eb]">
                      {task.incident?.description || task.notes || 'Emergency assistance requested.'}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0edef]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#76777d]">
                      <Clock className="h-3.5 w-3.5 text-[#45464d]" />
                      <span>
                        {t('volunteer.tasks.assignedToUnit')}: <strong className="text-[#1b1b1d]">{task.assigned_user_id || 'usr-volunteer-1'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted && !isOnSite && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isActionLoading}
                          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs h-8 px-3 font-semibold uppercase tracking-wider flex items-center gap-1.5"
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
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-3 font-semibold uppercase tracking-wider flex items-center gap-1.5"
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
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Mission Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
