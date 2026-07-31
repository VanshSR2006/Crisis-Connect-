import React, { useState } from 'react';
import { useCitizenContext } from '@/lib/citizenContext';
import { Shelter } from '@/types';
import { MapPin, Phone, Users, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';

type ShelterFilter = 'all' | 'open' | 'full';

export const Shelters: React.FC = () => {
  const { shelters } = useCitizenContext();
  const [filter, setFilter] = useState<ShelterFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredShelters = shelters.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalOpen = shelters.filter((s) => s.status === 'open').length;
  const totalBedsFree = shelters.reduce((acc, s) => acc + (s.capacity - s.current_occupancy), 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'Open',
          icon: CheckCircle,
          badgeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        };
      case 'full':
        return {
          label: 'At Capacity',
          icon: XCircle,
          badgeClasses: 'bg-[#ffdad6] text-[#93000a] border border-[#fca5a5]',
        };
      default:
        return {
          label: 'Closed',
          icon: AlertCircle,
          badgeClasses: 'bg-[#eae7e9] text-[#45464d] border border-[#c6c6cd]',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1b1b1d]" style={{ letterSpacing: '-0.02em' }}>
            Evacuation Shelters
          </h1>
          <p className="text-[13px] text-[#45464d] mt-0.5">
            {totalOpen} open shelters · {totalBedsFree} total beds available
          </p>
        </div>
        <div className="bg-white border border-[#c6c6cd] rounded px-3 py-1.5 text-center shadow-sm">
          <span className="block text-lg font-bold text-[#0f172a]">{totalBedsFree}</span>
          <span className="text-[10px] font-semibold text-[#45464d] uppercase tracking-[0.05em]">Beds Free</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#76777d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shelters by name or location..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-[#c6c6cd] rounded bg-white text-[#1b1b1d] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white border border-[#c6c6cd] rounded p-1 flex gap-0.5 shrink-0">
          {(['all', 'open', 'full'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                filter === opt
                  ? 'bg-[#0f172a] text-white'
                  : 'text-[#45464d] hover:bg-[#eae7e9]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shelters Cards List ───────────────────────────── */}
      <div className="space-y-3">
        {filteredShelters.length === 0 ? (
          <div className="bg-white border border-[#c6c6cd] rounded p-8 text-center text-[#76777d]">
            <p className="text-sm font-medium">No shelters match your filter criteria.</p>
          </div>
        ) : (
          filteredShelters.map((shelter, idx) => {
            const statusConfig = getStatusConfig(shelter.status);
            const StatusIcon = statusConfig.icon;
            const occupancyPct = Math.round((shelter.current_occupancy / shelter.capacity) * 100);
            const availableBeds = shelter.capacity - shelter.current_occupancy;

            return (
              <div
                key={shelter.id}
                className="bg-white border border-[#c6c6cd] rounded overflow-hidden shadow-sm hover:border-[#76777d] transition-colors"
              >
                {/* Header */}
                <div className="px-3.5 py-3 border-b border-[#f0edef] flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#1b1b1d] truncate">{shelter.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[#45464d]">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#76777d]" />
                      <span className="truncate">{shelter.location_name}</span>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider flex-shrink-0 ${statusConfig.badgeClasses}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5 space-y-2.5">
                  {/* Occupancy Indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-semibold text-[#45464d] flex items-center gap-1.5 uppercase tracking-[0.05em] text-[11px]">
                        <Users className="h-3.5 w-3.5 text-[#2563eb]" />
                        Occupancy
                      </span>
                      <span className="font-bold text-[#1b1b1d]">
                        {shelter.current_occupancy} / {shelter.capacity}{' '}
                        <span className="text-[10px] font-medium text-[#76777d]">({occupancyPct}% full)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#eae7e9] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPct >= 90
                            ? 'bg-[#ba1a1a]'
                            : occupancyPct >= 75
                            ? 'bg-[#c2410c]'
                            : 'bg-[#2563eb]'
                        }`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Contact & Beds info */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0edef] text-xs">
                    <div className="flex items-center gap-1.5 text-[#45464d]">
                      <Phone className="h-3.5 w-3.5 text-[#76777d]" />
                      <span>Contact: <strong className="text-[#1b1b1d]">{shelter.contact_number}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {availableBeds > 0 ? `${availableBeds} beds available` : 'Full'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
