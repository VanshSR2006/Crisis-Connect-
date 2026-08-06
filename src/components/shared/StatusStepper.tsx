import React from 'react';
import { useTranslation } from 'react-i18next';
import { IncidentStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Send, ShieldAlert } from 'lucide-react';

export interface StatusStepperProps {
  currentStatus: IncidentStatus;
  className?: string;
}

const STEPS: { key: IncidentStatus; labelKey: string; icon: React.ElementType }[] = [
  { key: 'reported', labelKey: 'common.reported', icon: ShieldAlert },
  { key: 'acknowledged', labelKey: 'common.acknowledged', icon: Clock },
  { key: 'dispatched', labelKey: 'common.dispatched', icon: Send },
  { key: 'resolved', labelKey: 'common.resolved', icon: CheckCircle2 },
];

export const StatusStepper: React.FC<StatusStepperProps> = ({ currentStatus, className }) => {
  const { t } = useTranslation();
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className={cn('w-full py-3', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
        
        {/* Active connector fill */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 dark:bg-blue-500 -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                  isCompleted && 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500',
                  isCurrent && 'bg-white border-blue-600 text-blue-600 dark:bg-slate-900 dark:border-blue-400 dark:text-blue-400 ring-4 ring-blue-100 dark:ring-blue-950',
                  !isCompleted && !isCurrent && 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium mt-1.5 whitespace-nowrap',
                  isCurrent ? 'text-blue-600 font-semibold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
