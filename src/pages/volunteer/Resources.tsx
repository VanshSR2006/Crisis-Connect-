import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockResources } from '@/mocks';
import { PackageCheck, Layers, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ResourceInventoryTable } from '@/components/shared/ResourceInventoryTable';

export const Resources: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'depleted'>('all');

  const filtered = filter === 'all'
    ? mockResources
    : mockResources.filter((r) => r.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: t('common.available'),
          classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'reserved':
        return {
          label: t('common.reserved'),
          classes: 'bg-amber-100 text-amber-800 border border-amber-300',
        };
      default:
        return {
          label: t('volunteer.resources.depleted'),
          classes: 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]',
        };
    }
  };

  const getFilterLabel = (s: 'all' | 'available' | 'reserved' | 'depleted') => {
    switch (s) {
      case 'all': return t('common.all');
      case 'available': return t('resources.statuses.available');
      case 'reserved': return t('resources.statuses.reserved');
      case 'depleted': return t('resources.statuses.depleted');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            {t('volunteer.resources.title')}
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {mockResources.length} {t('volunteer.resources.trackedSupplyCategories')}
          </p>
        </div>
      </div>

      {/* ── Status Filter ─────────────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 overflow-x-auto">
        {(['all', 'available', 'reserved', 'depleted'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap transition-colors ${
              filter === s
                ? 'bg-[#0f172a] text-white'
                : 'text-[#45464d] hover:bg-[#eae7e9]'
            }`}
          >
            {getFilterLabel(s)}
          </button>
        ))}
      </div>

      {/* ── Resource Cards List ───────────────────────────── */}
      <ResourceInventoryTable resources={filtered} />
    </div>
  );
};
