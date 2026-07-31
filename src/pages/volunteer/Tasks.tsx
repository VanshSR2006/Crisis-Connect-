import React, { useState } from 'react';
import { mockDispatches } from '@/mocks';
import { Dispatch, DispatchStatus } from '@/types';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Dispatch[]>(mockDispatches);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: DispatchStatus = t.status === 'completed' ? 'en_route' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            Volunteer Field Tasks
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {pendingCount} pending field tasks · {completedCount} completed
          </p>
        </div>
        <div className="bg-white border border-[#c6c6cd] rounded px-3 py-1.5 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#45464d] block">
            Progress
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% Done
          </span>
        </div>
      </div>

      {/* ── Task Cards List ───────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden">
        <div className="divide-y divide-[#f0edef]">
          {tasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`px-3 py-3 hover:bg-[#f6f3f5] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <span className="text-[14px] font-bold text-[#1b1b1d]">
                      Field Order #{task.id}
                    </span>
                    <span className="ml-2 text-[11px] text-[#76777d] font-mono">
                      Ref: Incident #{task.incident_id}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#d5e3fc] text-[#57657a] border border-[#b9c7df]'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[13px] text-[#45464d] leading-[18px] mb-3">{task.notes}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#f0edef]">
                  <div className="flex items-center gap-1 text-[11px] text-[#76777d]">
                    <Clock className="h-3 w-3" />
                    <span>Assigned to Unit {task.assigned_user_id}</span>
                  </div>
                  <Button
                    variant={isCompleted ? 'outline' : 'primary'}
                    size="sm"
                    className="text-xs h-8 px-3"
                    onClick={() => toggleTaskStatus(task.id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    <span>{isCompleted ? 'Reopen Task' : 'Mark Complete'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
