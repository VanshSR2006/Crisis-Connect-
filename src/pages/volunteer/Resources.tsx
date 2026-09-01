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
    <div className="space-y-5">
      {/* ── Page Header with Resource Stock Background Image ─────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-slate-700/80 shadow-xl group">
        {/* Background Image related to resource stock inventory */}
        <img
          src="/resource_stock_bg.jpg"
          alt="Resource Stock Logistics Warehouse"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%] filter brightness-[0.88] contrast-[1.05] scale-105 pointer-events-none group-hover:scale-110 transition-transform duration-700"
        />
        {/* Soft Dark Gradient Overlay for Maximum Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/70 pointer-events-none" />

        {/* Header Content Overlay */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>RELIEF SUPPLY LOGISTICS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
              {t('volunteer.resources.title')}
            </h1>
            <p className="text-xs font-semibold text-slate-300 drop-shadow-xs flex items-center gap-2">
              <span className="text-emerald-400 font-bold">{mockResources.length} {t('volunteer.resources.trackedSupplyCategories')}</span>
              <span>•</span>
              <span>Across Active Shelters</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Elevated Inventory Summary Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-4 py-2 text-center shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                STOCK CATEGORIES
              </span>
              <span className="text-sm font-black text-emerald-400 drop-shadow-xs font-mono">
                {mockResources.length} ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Filter ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex gap-1.5 overflow-x-auto shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
        {(['all', 'available', 'reserved', 'depleted'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
              filter === s
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border border-emerald-400/40 -translate-y-0.5'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {getFilterLabel(s)}
          </button>
        ))}
      </div>

      {/* ── Resource Cards List ───────────────────────────── */}
      <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
        <ResourceInventoryTable resources={filtered} />
      </div>
    </div>
  );
};
