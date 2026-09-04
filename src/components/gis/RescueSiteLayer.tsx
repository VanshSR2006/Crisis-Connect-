import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { RescueSite, RankedRescueSite } from '@/lib/api/rescueSites';

interface RescueSiteLayerProps {
  isVisible: boolean;
  sites: (RescueSite | RankedRescueSite)[];
  selectedSiteId: string | null;
  onSiteClick?: (id: string) => void;
}

function isRankedSite(site: RescueSite | RankedRescueSite): site is RankedRescueSite {
  return 'suitability_score' in site;
}

function createSiteIcon(site: RescueSite | RankedRescueSite, isSelected: boolean, rank?: number) {
  const accessColor = {
    accessible: isSelected ? 'bg-emerald-600' : 'bg-emerald-500',
    limited: isSelected ? 'bg-amber-600' : 'bg-amber-500',
    blocked: 'bg-slate-500',
  }[site.access_status] ?? 'bg-emerald-500';

  const html = renderToString(
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap text-white ${accessColor} ${
        isSelected ? 'ring-4 ring-white ring-offset-1 scale-125 z-50' : 'opacity-95 hover:scale-105 transition-transform'
      }`}
    >
      {/* Diamond / safe-site shield icon */}
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 12l10 10 10-10L12 2z" />
      </svg>
      <span>{rank !== undefined ? `#${rank}` : 'SITE'}</span>
    </div>
  );

  return L.divIcon({
    html,
    className: 'rescue-site-leaflet-icon',
    iconSize: [46, 24],
    iconAnchor: [23, 12],
    popupAnchor: [0, -14],
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
        const ranked = isRankedSite(site);
        const rank = ranked ? idx + 1 : undefined;

        return (
          <Marker
            key={site.id}
            position={[site.lat, site.lng]}
            icon={createSiteIcon(site, isSelected, rank)}
            eventHandlers={{ click: () => onSiteClick?.(site.id) }}
            zIndexOffset={isSelected ? 900 : 100}
          >
            <Popup className="rescue-site-popup">
              <div className="p-1 min-w-[210px]">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <div className="min-w-0 pr-1">
                    <h4 className="font-bold text-[#1b1b1d] truncate text-sm">{site.name}</h4>
                    {ranked && (
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        Rank #{idx + 1} · Score: {site.suitability_score.toFixed(1)}/100
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    site.access_status === 'accessible' ? 'bg-emerald-100 text-emerald-800' :
                    site.access_status === 'limited' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {site.access_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#45464d]">
                  <div className="flex justify-between">
                    <span className="font-semibold">Capacity:</span>
                    <span>{site.capacity - site.current_occupancy} / {site.capacity} free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Elevation:</span>
                    <span>{site.elevation_m} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Flood Margin:</span>
                    <span className={site.predicted_flood_margin_m > 0 ? 'text-emerald-700 font-semibold' : 'text-red-700 font-bold'}>
                      {site.predicted_flood_margin_m > 0 ? `+${site.predicted_flood_margin_m}m` : `${site.predicted_flood_margin_m}m (Unsafe)`}
                    </span>
                  </div>
                  {site.zone_id && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Zone:</span>
                      <span className="font-mono">{site.zone_id}</span>
                    </div>
                  )}
                  {ranked && (
                    <div className="flex justify-between border-t pt-1 mt-1 text-[11px]">
                      <span className="font-semibold text-slate-600">Distance:</span>
                      <span className="font-bold text-slate-800">{site.distance_km.toFixed(1)} km</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
