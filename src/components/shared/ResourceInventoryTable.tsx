import React from 'react';
import { useTranslation } from 'react-i18next';
import { Resource } from '@/types';

interface ResourceInventoryTableProps {
  resources: Resource[];
}

export const ResourceInventoryTable: React.FC<ResourceInventoryTableProps> = ({ resources }) => {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: t('resources.statuses.available'),
          classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'reserved':
        return {
          label: t('resources.statuses.reserved'),
          classes: 'bg-amber-100 text-amber-800 border border-amber-300',
        };
      default:
        return {
          label: t('resources.statuses.depleted'),
          classes: 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]',
        };
    }
  };

  return (
    <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden">
      <div className="divide-y divide-[#f0edef]">
        {resources.map((res, idx) => {
          const statusConfig = getStatusBadge(res.status);

          return (
            <div
              key={res.id}
              className={`px-3 py-3 hover:bg-[#f6f3f5] transition-colors ${
                idx % 2 === 1 ? 'bg-[#f6f3f5]' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div>
                  <span className="text-[14px] font-bold text-[#1b1b1d]">
                    {t(`resources.names.${res.name}`)}
                  </span>
                  <span className="ml-2 text-[11px] text-[#76777d] uppercase tracking-wide font-medium">
                    {t(`resources.categories.${res.category}`)}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${statusConfig.classes}`}
                >
                  {statusConfig.label}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0edef] text-[12px]">
                <span className="text-[#45464d]">{t('volunteer.resources.stockQuantity')}:</span>
                <span className="font-bold text-[#1b1b1d]">
                  {res.quantity} <span className="text-[11px] font-normal text-[#76777d]">{t(`resources.units.${res.unit}`)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
