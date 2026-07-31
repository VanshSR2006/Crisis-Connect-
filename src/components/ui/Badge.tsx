import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-semibold rounded transition-colors uppercase tracking-wider';

    const variants = {
      default: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
      secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800',
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-[10px]',
      md: 'px-2 py-0.5 text-xs',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
