import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Activity, 
  Zap, 
  Compass, 
  LifeBuoy,
  Play,
  X,
  Tv,
  RadioTower,
  Radio,
  ExternalLink,
  RotateCcw,
  Youtube
} from 'lucide-react';

export interface DisasterZone {
  id: string;
  name: string;
  disaster: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  coordsText: string;
  description: string;
  icon: React.ReactNode;
  severityBg?: string;
  severityBadge?: string;
  badgeDot?: string;
  borderHover?: string;
  accentGradient?: string;
  youtubeId?: string;
  videoTitle?: string;
}

export const activeZonesData: DisasterZone[] = [
  {
    id: 'UK-01',
    name: 'Uttarakhand Himalayan Sector',
    disaster: 'Landslide / Flash Flood',
    severity: 'CRITICAL',
    status: 'Active Rescue Dispatch',
    coordsText: '30.0668° N, 79.0193° E',
    description: 'High-altitude landslide monitoring & active flash flood rescue operations deployed across Himalayan valleys.',
    icon: <LifeBuoy className="h-7 w-7 text-red-500 animate-pulse" />,
    severityBg: 'bg-red-950/80 text-red-300 border-red-800',
    severityBadge: 'bg-red-600 text-white font-bold',
    badgeDot: 'bg-red-400 animate-ping',
    borderHover: 'hover:border-red-500',
    accentGradient: 'from-red-500 via-amber-500 to-red-600',
    youtubeId: 'yxK-s7QrMew',
    videoTitle: 'Uttarakhand Landslide Reports & Emergency Operations'
  },
  {
    id: 'AS-02',
    name: 'Assam Brahmaputra Basin',
    disaster: 'Brahmaputra Flood Zone',
    severity: 'HIGH',
    status: 'NDRF Evacuation Active',
    coordsText: '26.2006° N, 92.9376° E',
    description: 'Riverine flood response and NDRF boat evacuation teams deployed along flooded riverbank settlements.',
    icon: <ShieldAlert className="h-7 w-7 text-amber-500" />,
    severityBg: 'bg-amber-950/80 text-amber-300 border-amber-800',
    severityBadge: 'bg-amber-500 text-white font-bold',
    badgeDot: 'bg-amber-300 animate-ping',
    borderHover: 'hover:border-amber-500',
    accentGradient: 'from-amber-500 via-orange-500 to-amber-600',
    youtubeId: 'SNDHaJZaVwk',
    videoTitle: 'Assam Flood Reality & Emergency Response Operations'
  },
  {
    id: 'OD-03',
    name: 'Odisha & Bengal Coastal Belt',
    disaster: 'Cyclone / Coastal Surge',
    severity: 'MEDIUM',
    status: 'Radar Tracking Active',
    coordsText: '20.9517° N, 85.0985° E',
    description: 'Coastal weather radar monitoring & storm shelter readiness coordination across Bay of Bengal sectors.',
    icon: <RadioTower className="h-7 w-7 text-blue-500" />,
    severityBg: 'bg-blue-950/80 text-blue-300 border-blue-800',
    severityBadge: 'bg-blue-600 text-white font-bold',
    badgeDot: 'bg-blue-300 animate-ping',
    borderHover: 'hover:border-blue-500',
    accentGradient: 'from-blue-500 via-cyan-500 to-blue-600',
    youtubeId: 'FRoeJ-C5rrI',
    videoTitle: 'Odisha Cyclone & Coastal Vulnerability Analysis'
  },
  {
    id: 'KL-04',
    name: 'Kerala & Konkan Coast',
    disaster: 'Heavy Monsoonal Rain',
    severity: 'LOW',
    status: 'Automated Alert Standby',
    coordsText: '10.8505° N, 76.2711° E',
    description: 'Western Ghats slope stability monitoring & automated emergency alert network standing by.',
    icon: <Compass className="h-7 w-7 text-emerald-500" />,
    severityBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    severityBadge: 'bg-emerald-600 text-white font-bold',
    badgeDot: 'bg-emerald-300 animate-ping',
    borderHover: 'hover:border-emerald-500',
    accentGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
    youtubeId: 'cTvgF-YK4Rs',
    videoTitle: 'Western Ghats Landslide & Monsoonal Risk Analysis'
  },
];

export const ActiveDisasterZonesMapSection: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<DisasterZone | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto font-sans text-slate-100 relative z-10 space-y-12">
      {/* ── Section Header with Live Radar Telemetry Indicator ─── */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2.5 px-1 py-1 bg-transparent text-slate-900 text-xs font-black tracking-wider uppercase">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <Activity className="h-4 w-4 text-amber-600 animate-pulse" />
          <span className="text-slate-900 font-black">Real-time Geospatial Overview</span>
          <span className="text-emerald-700 font-mono font-extrabold text-[11px] ml-1">
            • 4 ZONES LIVE
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Active Disaster Zones in India
        </h2>

        <p className="text-slate-700 text-sm sm:text-base font-semibold leading-relaxed max-w-2xl mx-auto">
          Real-time overview of high-risk regions. Click any card to flip and reveal live YouTube video report link.
        </p>
      </div>

      {/* ── 4 Interactive Live Disaster Cards Grid ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeZonesData.map((zone) => {
          const isFlipped = !!flippedCards[zone.id];
          const youtubeUrl = `https://www.youtube.com/watch?v=${zone.youtubeId}`;

          return (
            <div
              key={zone.id}
              className="relative w-full h-[450px] cursor-pointer group"
              style={{ perspective: '1000px' }}
              onClick={() => toggleFlip(zone.id)}
            >
              <div
                className="w-full h-full relative transition-transform duration-700 shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ── FRONT SIDE OF CARD ────────────────────────────────── */}
                <div
                  className={`absolute inset-0 w-full h-full bg-[#EFF6FF] border-2 border-blue-300 ${zone.borderHover} rounded-none p-6 flex flex-col justify-between text-left text-slate-950 overflow-hidden shadow-xl`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${zone.accentGradient}`} />

                  <div className="space-y-3.5 pt-1">
                    {/* Top Header Row: Icon & Severity Badge */}
                    <div className="flex items-center justify-between">
                      {/* Icon Box */}
                      <div className="w-12 h-12 rounded-none bg-white/95 border border-blue-200 flex items-center justify-center relative shadow-xs">
                        {zone.icon}
                      </div>

                      {/* Severity Badge */}
                      <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-none uppercase tracking-wider flex items-center gap-1.5 border border-slate-900/20 shadow-xs ${zone.severityBadge}`}>
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${zone.badgeDot} opacity-75`}></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        {zone.severity}
                      </span>
                    </div>

                    {/* Zone ID & Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-amber-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-none uppercase tracking-wider shadow-xs">
                          ZONE ID: {zone.id}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-100 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-none uppercase flex items-center gap-1 shadow-xs">
                          <RotateCcw className="h-3 w-3 text-blue-300" />
                          <span>FLIP CARD</span>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-snug">
                        {zone.name}
                      </h3>
                    </div>

                    {/* Disaster Type & Status */}
                    <div className="p-2.5 rounded-none bg-white/90 border border-blue-200 space-y-1 shadow-xs">
                      <p className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>{zone.disaster}</span>
                      </p>
                      <p className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                        <Radio className="h-3 w-3 text-emerald-600 animate-pulse shrink-0" />
                        <span>{zone.status}</span>
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-slate-900 text-xs leading-relaxed font-semibold">
                      {zone.description}
                    </p>
                  </div>

                  {/* Bottom Bar */}
                  <div className="w-full pt-3 border-t border-blue-200 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-900 flex items-center gap-1 font-bold">
                      <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      {zone.coordsText.split(',')[0]}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-950 group-hover:text-blue-700 transition-colors">
                      <span>CLICK TO FLIP</span>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* ── BACK SIDE OF CARD ─────────────────────────────────── */}
                <div
                  className="absolute inset-0 w-full h-full bg-[#FFEBCC] border-2 border-red-500 rounded-none p-5 flex flex-col justify-between text-left text-slate-950 overflow-hidden shadow-xl"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

                  <div className="space-y-3 pt-1">
                    {/* Back Header */}
                    <div className="flex items-center justify-between border-b border-[#f2ce9d] pb-2">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-600" />
                        <span className="text-xs font-mono font-black text-red-700 uppercase tracking-wider">
                          LIVE YOUTUBE REPORT
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleFlip(zone.id, e)}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-950 text-white border border-slate-800 rounded-none flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="h-3 w-3 text-amber-300" />
                        <span>FLIP BACK</span>
                      </button>
                    </div>

                    {/* Zone Title */}
                    <div>
                      <span className="text-[10px] font-mono font-black text-amber-950 uppercase">
                        {zone.id} • {zone.disaster}
                      </span>
                      <h4 className="text-sm font-black text-slate-950 line-clamp-1">
                        {zone.name}
                      </h4>
                    </div>

                    {/* YouTube Video Thumbnail Preview */}
                    <div className="relative w-full h-36 bg-slate-900 border border-slate-800 rounded-none overflow-hidden group/thumb shadow-sm">
                      <img
                        src={`https://img.youtube.com/vi/${zone.youtubeId}/hqdefault.jpg`}
                        alt={zone.videoTitle}
                        className="w-full h-full object-cover filter brightness-90 group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-center">
                        <div className="w-10 h-10 rounded-none bg-red-600/90 border border-red-400 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Visible YouTube Link Box */}
                    <div className="p-2.5 bg-white/90 border border-[#f2ce9d] rounded-none space-y-1 shadow-xs">
                      <span className="text-[10px] font-mono text-slate-800 font-black uppercase block">
                        YOUTUBE DIRECT LINK:
                      </span>
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-mono text-blue-700 hover:text-blue-900 underline font-bold break-all flex items-center gap-1"
                      >
                        <span className="truncate">{youtubeUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Actions on Back Side */}
                  <div className="w-full space-y-2 pt-2 border-t border-[#f2ce9d]">
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-black uppercase tracking-wider rounded-none flex items-center justify-center gap-2 border border-red-500 shadow-md transition-colors"
                    >
                      <Youtube className="h-4 w-4" />
                      <span>OPEN ON YOUTUBE ↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideo(zone);
                      }}
                      className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider rounded-none flex items-center justify-center gap-1.5 border border-slate-800 transition-colors cursor-pointer shadow-sm"
                    >
                      <Tv className="h-3.5 w-3.5" />
                      <span>WATCH IN CRISISCONNECT PLAYER ▶</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── In-App YouTube Video Overlay Modal ───────────────────── */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10 animate-fadeIn"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-black border-2 border-slate-800 rounded-none overflow-hidden w-full max-w-4xl shadow-2xl space-y-0 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-none bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
                  <Play className="h-5 w-5 fill-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-none uppercase">
                      CRISISCONNECT LIVE REPORT
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {activeVideo.id} • {activeVideo.name}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                    {activeVideo.videoTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-2 bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700 rounded-none transition-all cursor-pointer"
                title="Close Video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Responsive 16:9 YouTube Video Embed */}
            <div className="relative w-full pb-[56.25%] bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.videoTitle}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-none bg-red-500 animate-ping" />
                <span>STREAMING IN CRISISCONNECT</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Close Video Player [X]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
