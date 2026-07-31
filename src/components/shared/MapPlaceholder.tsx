import React from 'react';
import { MapPin, Navigation, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MapPlaceholderProps {
  title?: string;
  height?: string;
  centerCoordinates?: string;
  className?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  title = 'Geospatial Disaster Live Map View',
  height = 'h-72',
  centerCoordinates = '28.6139° N, 77.2090° E (Delhi NCR Basin)',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative w-full rounded border overflow-hidden flex flex-col justify-between p-4 bg-slate-900 text-slate-100 dark:bg-slate-950 dark:border-slate-800',
        height,
        className
      )}
    >
      {/* Decorative Grid Pattern representing map grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-sm tracking-wide text-slate-100">{title}</span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-blue-950/80 border border-blue-800 text-blue-300 px-2 py-0.5 rounded">
          GIS Map Component (Phase 2/3 Target)
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center space-y-2">
        <div className="p-3 bg-blue-600/20 rounded-full border border-blue-500/40 text-blue-400 animate-bounce">
          <MapPin className="h-6 w-6" />
        </div>
        <p className="text-xs font-mono text-slate-300">{centerCoordinates}</p>
        <p className="text-[11px] text-slate-400 max-w-sm">
          Interactive Leaflet map layer rendering live risk heatmaps, shelter overlays, and incident coordinates will be loaded in Phase 2/3.
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
        <div className="flex items-center space-x-1">
          <Navigation className="h-3 w-3 text-emerald-400" />
          <span>Live Tracking Ready</span>
        </div>
        <span>Layers: Risk / Shelters / Incidents</span>
      </div>
    </div>
  );
};
