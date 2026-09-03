import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Compass,
  MapPin,
  Waves,
  Radio,
  AlertTriangle,
  Eye,
  Layers,
  Zap,
  ShieldCheck,
  Navigation,
  Globe2,
  Info
} from 'lucide-react';

export interface FloodZoneRegion {
  id: string;
  name: string;
  riverBasin: string;
  vulnerability: 'EXTREME' | 'HIGH' | 'MODERATE';
  areaCoverage: string;
  description: string;
  pinPos: { x: number; y: number }; // Percentage position on map
  color: string;
}

export const floodProneRegionsData: FloodZoneRegion[] = [
  {
    id: 'GB-01',
    name: 'Indo-Gangetic River Basin',
    riverBasin: 'Ganga, Yamuna & Kosi Systems (UP, Bihar, WB)',
    vulnerability: 'EXTREME',
    areaCoverage: '24.5 Million Hectares',
    description: 'Densely populated plain subject to heavy monsoon runoff, river breach, and mountain catchment overflows.',
    pinPos: { x: 42, y: 32 },
    color: '#0284c7',
  },
  {
    id: 'BR-02',
    name: 'Brahmaputra Valley Sector',
    riverBasin: 'Brahmaputra & Barak Basins (Assam & NE)',
    vulnerability: 'EXTREME',
    areaCoverage: '4.7 Million Hectares',
    description: 'Narrow river corridor experiencing rapid siltation, cloudburst inundation, and annual bank erosion.',
    pinPos: { x: 82, y: 35 },
    color: '#0369a1',
  },
  {
    id: 'EC-03',
    name: 'Eastern Coastal Delta Belt',
    riverBasin: 'Mahanadi, Godavari & Krishna Deltas (Odisha, AP)',
    vulnerability: 'HIGH',
    areaCoverage: '8.2 Million Hectares',
    description: 'Low-lying deltaic zone prone to combined cyclone storm surges and river discharge backwater.',
    pinPos: { x: 62, y: 58 },
    color: '#38bdf8',
  },
  {
    id: 'WC-04',
    name: 'Western & Konkan Coastal Strip',
    riverBasin: 'Western Ghats Streams (Konkan, Goa, Kerala)',
    vulnerability: 'MODERATE',
    areaCoverage: '3.1 Million Hectares',
    description: 'Steep hill catchments leading to rapid urban flash floods and coastal high-tide river backing.',
    pinPos: { x: 34, y: 78 },
    color: '#06b6d4',
  },
];

export const MajorFloodProneAreas3DMapSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeRegionId, setActiveRegionId] = useState<string>('GB-01');

  const selectedRegion = floodProneRegionsData.find((r) => r.id === activeRegionId) || floodProneRegionsData[0];

  return (
    <div className="w-full max-w-7xl mx-auto font-sans text-white relative z-20">
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wider uppercase shadow-md">
            <Waves className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>GIS Hydrographic Satellite Analysis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            Major Flood Prone Areas of India
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-semibold drop-shadow-xs">
            3D Geospatial mapping of high-vulnerability river basins, coastal deltas, and monsoon inundation sectors
          </p>
        </div>

        {/* Top 3D Control Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-200">3D TELEMETRY LIVE</span>
          </div>
        </div>
      </div>

      {/* ── 3D Interactive Map Environment Stage ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

        {/* ── LEFT 8 COLUMNS: 3D Perspective Map Canvas ─────────────── */}
        <div className="lg:col-span-8 bg-gradient-to-b from-slate-900/95 via-slate-900/85 to-slate-950/95 border-t-2 border-t-cyan-400/50 border-b-2 border-b-slate-950 border-x border-slate-800 rounded-3xl p-4 sm:p-7 shadow-[0_30px_70px_rgba(0,0,0,0.65)] relative overflow-hidden flex flex-col justify-between">

          {/* Top Bar: Compass Rose & Map Legend */}
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-3.5 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="font-mono font-black text-white tracking-wider uppercase text-[11px]">
                HYDRO-GIS SATELLITE OVERLAY
              </span>
            </div>

            {/* Realistic Compass Widget */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-xl text-[11px] font-mono text-cyan-300 font-bold shadow-inner">
              <Compass className="h-4 w-4 text-cyan-400 animate-spin-slow" />
              <span>N 20.5937° • E 78.9629°</span>
            </div>
          </div>

          {/* 3D Elevated Map Display Container */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl my-3 flex items-center justify-center group perspective-[1000px]">

            {/* Background Grid & Radar Sweep */}
            <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 pointer-events-none" />

            {/* Ocean Regions Typography Labels (Matching Reference Image) */}
            <div className="absolute top-6 left-6 text-slate-400 font-serif italic text-xs tracking-widest pointer-events-none drop-shadow-md">
              Arabian Sea
            </div>
            <div className="absolute top-1/2 right-6 -translate-y-1/2 text-slate-400 font-serif italic text-xs tracking-widest pointer-events-none drop-shadow-md">
              Bay of Bengal
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 font-serif italic text-xs tracking-widest pointer-events-none drop-shadow-md">
              Indian Ocean
            </div>

            {/* Vector Map SVG Canvas */}
            <div className="w-full h-full p-4 sm:p-6 relative transform-gpu transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-x-1">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] opacity-95"
              >
                <defs>
                  {/* Subtle 3D Depth Gradient */}
                  <linearGradient id="mapSurface" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                  </linearGradient>

                  {/* Glowing 3D Blue Hazard Zone Filter */}
                  <radialGradient id="floodGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#0284c7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* India Outline Boundary Vector Path */}
                <path
                  d="M 235 60 
                     L 265 65 L 290 85 L 285 105 L 305 125 L 340 120 L 375 140 L 435 155 L 455 175 L 430 195 L 405 180 L 380 200 L 360 190 L 340 215 
                     L 355 245 L 345 285 L 320 320 L 295 360 L 275 400 L 255 450 L 245 450 L 235 410 L 205 350 L 180 300 L 160 250 L 140 220 L 125 185 
                     L 145 165 L 175 160 L 200 135 L 180 115 L 205 85 Z"
                  fill="url(#mapSurface)"
                  stroke="#0284c7"
                  strokeWidth="2"
                  className="transition-all duration-300"
                />

                {/* ── Highlighted Blue 3D Flood Prone Areas (Overlaid Areas) ───── */}

                {/* 1. Ganga / Himalayan River Corridor (Blue Ribbon Overlay) */}
                <path
                  d="M 180 135 C 230 145, 270 170, 340 215 C 330 235, 280 200, 210 165 Z"
                  fill="#0284c7"
                  fillOpacity="0.75"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <path
                  d="M 200 145 C 240 160, 290 185, 335 220"
                  stroke="#7dd3fc"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />

                {/* 2. Brahmaputra Valley Corridor (NE Blue Ribbon) */}
                <path
                  d="M 375 145 C 400 150, 445 165, 430 190 C 405 180, 385 165, 375 145 Z"
                  fill="#0369a1"
                  fillOpacity="0.8"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />

                {/* 3. Eastern Coastal Flood Zone (Odisha & Bengal Ribbon) */}
                <path
                  d="M 340 215 C 350 250, 330 290, 295 360 C 285 340, 310 280, 320 230 Z"
                  fill="#0284c7"
                  fillOpacity="0.75"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />

                {/* 4. Western Coastal Flood Strip (Konkan & Malabar Coast) */}
                <path
                  d="M 160 250 C 180 300, 205 350, 245 450 C 235 430, 195 340, 155 270 Z"
                  fill="#0369a1"
                  fillOpacity="0.7"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              </svg>

              {/* Dynamic Interactive Hotspot Pins on 3D Map */}
              {floodProneRegionsData.map((region) => {
                const isSelected = activeRegionId === region.id;

                return (
                  <div
                    key={region.id}
                    onClick={() => setActiveRegionId(region.id)}
                    style={{ left: `${region.pinPos.x}%`, top: `${region.pinPos.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-200 ${isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                      }`}
                  >
                    {/* Glowing Water Pulse Rings */}
                    <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75" />

                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-700 border-2 border-white shadow-[0_0_18px_rgba(56,189,248,0.9)] cursor-pointer`}>
                      <Waves className="h-4 w-4 text-white drop-shadow-xs" />
                    </div>

                    {/* Pin Label Tag */}
                    <div className={`absolute left-1/2 -translate-x-1/2 top-9 bg-slate-950/95 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap flex items-center gap-1 shadow-lg ${isSelected ? 'ring-2 ring-cyan-400 bg-cyan-950 text-cyan-200' : 'opacity-85'
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{region.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Map Legend Card (Matching Attached Reference Image) */}
            <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl flex items-center gap-3 text-xs z-30">
              <div className="w-6 h-3 bg-gradient-to-r from-sky-500 to-blue-700 rounded border border-cyan-300 shrink-0" />
              <div className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Flood Prone Areas (Major Rivers & Coasts)
              </div>
            </div>
          </div>

          {/* Map Bottom Telemetry Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2 sm:gap-0">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              Data Source: Central Water Commission (CWC) & National Disaster Management Authority
            </span>
            <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
              SATELLITE RADAR ONLINE
            </span>
          </div>
        </div>

        {/* ── RIGHT 4 COLUMNS: Region Details & Flood Sector Telemetry ───── */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              FLOOD SECTOR VULNERABILITY QUEUE ({floodProneRegionsData.length})
            </h3>

            {/* Flood Regions Cards List */}
            <div className="space-y-3">
              {floodProneRegionsData.map((region) => {
                const isSelected = activeRegionId === region.id;

                return (
                  <div
                    key={region.id}
                    onClick={() => setActiveRegionId(region.id)}
                    className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer border relative ${isSelected
                        ? 'bg-slate-900/95 border-cyan-400 shadow-[0_10px_25px_rgba(2,132,199,0.3)] -translate-y-0.5'
                        : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 shadow-md hover:-translate-y-0.5'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded">
                        {region.id}
                      </span>
                      <span className="text-[10px] font-mono font-black text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {region.vulnerability}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white drop-shadow-xs">
                      {region.name}
                    </h4>

                    <p className="text-[11px] text-cyan-300 font-semibold font-mono mt-0.5">
                      {region.riverBasin}
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed mt-2 font-medium">
                      {region.description}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Area Affected:</span>
                      <span className="font-mono font-bold text-white">{region.areaCoverage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Hydrographic Summary Footer Widget */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1.5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-white">
                <Globe2 className="h-4 w-4 text-cyan-400" />
                Total Indian Flood Plain
              </span>
              <span className="text-cyan-400 font-mono font-black text-sm">40M+ Ha</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal font-medium">
              Over 12% of India's landmass is subject to severe riverine & coastal monsoon flooding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
