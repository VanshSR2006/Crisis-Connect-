import React, { useState } from 'react';
import { mockResources } from '@/mocks';
import { PackageCheck, Layers, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export const Resources: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'depleted'>('all');

  const filtered = filter === 'all'
    ? mockResources
    : mockResources.filter((r) => r.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'reserved':
        return {
          label: 'Reserved',
          classes: 'bg-amber-100 text-amber-800 border border-amber-300',
        };
      default:
        return {
          label: 'Depleted',
          classes: 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            Resource Stock Inventory
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {mockResources.length} tracked supply categories across active shelters
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
            {s}
          </button>
        ))}
      </div>

      {/* ── Resource Cards List ───────────────────────────── */}
      <div className="bg-white border border-[#c6c6cd] rounded overflow-hidden">
        <div className="divide-y divide-[#f0edef]">
          {filtered.map((res, idx) => {
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
                    <span className="text-[14px] font-bold text-[#1b1b1d]">{res.name}</span>
                    <span className="ml-2 text-[11px] text-[#76777d] uppercase tracking-wide font-medium">
                      {res.category}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 ${statusConfig.classes}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0edef] text-[12px]">
                  <span className="text-[#45464d]">Stock Quantity:</span>
                  <span className="font-bold text-[#1b1b1d]">
                    {res.quantity} <span className="text-[11px] font-normal text-[#76777d]">{res.unit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
