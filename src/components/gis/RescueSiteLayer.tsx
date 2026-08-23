import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { RankedRescueSite } from '@/lib/api/rescueSites';

interface RescueSiteLayerProps {
  isVisible: boolean;
  sites: RankedRescueSite[];
  selectedSiteId: string | null;
  onSiteClick: (id: string) => void;
}

function createSiteIcon(site: RankedRescueSite, isSelected: boolean, rank: number) {
  const accessColor = {
    accessible: isSelected ? 'bg-emerald-600' : 'bg-emerald-500',
    limited: isSelected ? 'bg-amber-600' : 'bg-amber-500',
    blocked: 'bg-slate-500',
  }[site.access_status] ?? 'bg-emerald-500';

  const html = renderToString(
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap text-white ${accessColor} ${
        isSelected ? 'ring-4 ring-white ring-offset-1 scale-125 z-50' : 'opacity-90'
      }`}
    >
      {/* Diamond / shelter icon */}
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 12l10 10 10-10L12 2z" />
      </svg>
      <span>#{rank}</span>
    </div>
  );

  return L.divIcon({
    html,
    className: 'rescue-site-leaflet-icon',
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
}

export const RescueSiteLayer: React.FC<RescueSiteLayerProps> = ({
  isVisible,
  sites,
  selectedSiteId,
  onSiteClick,
}) => {
  if (!isVisible || sites.length === 0) return null;

  const validSites = sites.filter(
    s => typeof s.lat === 'number' && typeof s.lng === 'number' &&
         !isNaN(s.lat) && !isNaN(s.lng) &&
         s.lat !== 0 && s.lng !== 0
  );

  return (
    <>
      {validSites.map((site, idx) => {
        const isSelected = selectedSiteId === site.id;
        return (
          <Marker
            key={site.id}
            position={[site.lat, site.lng]}
            icon={createSiteIcon(site, isSelected, idx + 1)}
            eventHandlers={{ click: () => onSiteClick(site.id) }}
            zIndexOffset={isSelected ? 900 : 100}
          />
        );
      })}
    </>
  );
};
