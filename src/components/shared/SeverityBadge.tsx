import React from 'react';
import { useTranslation } from 'react-i18next';
import { SeverityLevel } from '@/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, ShieldCheck, Info } from 'lucide-react';

export interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  showIcon = true,
}) => {
  const { t } = useTranslation();

  const config = {
    low: {
      label: t('common.low'),
      styles: 'bg-[#15803d] text-white',
      icon: ShieldCheck,
    },
    medium: {
      label: t('common.medium'),
      styles: 'bg-amber-400 text-amber-950 border border-amber-500 font-bold',
      icon: Info,
    },
    high: {
      label: t('common.high'),
      styles: 'bg-[#c2410c] text-white',
      icon: AlertCircle,
    },
    critical: {
      label: t('common.critical'),
      styles: 'bg-[#ba1a1a] text-white animate-pulse',
      icon: AlertTriangle,
    },
  };

  const { label, styles, icon: Icon } = config[severity] || config.low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm shrink-0',
        styles,
        className
      )}
      data-testid={`severity-badge-${severity}`}
    >
      {showIcon && <Icon className="h-3 w-3 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
