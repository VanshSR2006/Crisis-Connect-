import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, SeverityLevel } from '@/types';
import { LiveRiskZone } from '@/lib/officerContext';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons based on severity
const createMarkerIcon = (severity: SeverityLevel) => {
  const colorMap = {
    critical: '#ba1a1a',
    high: '#c2410c',
    medium: '#eab308',
    low: '#10b981'
  };
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${colorMap[severity] || '#3b82f6'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

interface OfficerMiniMapProps {
  incidents: Incident[];
  riskZones: LiveRiskZone[];
  onClickMap?: () => void;
}

export const OfficerMiniMap: React.FC<OfficerMiniMapProps> = ({ incidents, riskZones, onClickMap }) => {
  // Center map on Cachar District, Assam
  const defaultCenter: [number, number] = [24.8333, 92.7789];

  // Helper to determine polygon color based on risk severity
  const getRiskColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return '#ba1a1a';
      case 'high': return '#c2410c';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <div 
      className="h-72 w-full relative z-0" 
      onClick={(e) => {
        // Prevent event bubbling if clicking inside the map to avoid navigating unintentionally,
        // but if they click a non-interactive part, we can trigger the navigation.
        // For simplicity, we just overlay a clickable div if onClickMap is provided.
      }}
    >
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Risk Zones Layer */}
        {riskZones.map(zone => {
          if (!zone.boundary_json) return null;
          try {
            const geoJson = JSON.parse(zone.boundary_json);
            if (geoJson.type === 'Polygon') {
              // GeoJSON coordinates are [lng, lat], Leaflet wants [lat, lng]
              const positions = geoJson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
              return (
                <Polygon
                  key={zone.id}
                  positions={positions}
                  pathOptions={{
                    color: getRiskColor(zone.risk_level),
                    fillColor: getRiskColor(zone.risk_level),
                    fillOpacity: 0.15,
                    weight: 1.5,
                  }}
                  interactive={false}
                />
              );
            }
          } catch (e) {
            console.error("Invalid GeoJSON for mini map", e);
          }
          return null;
        })}

        {/* Incident Markers Layer */}
        {incidents.map(incident => (
          <Marker 
            key={incident.id} 
            position={[incident.lat, incident.lng]} 
            icon={createMarkerIcon(incident.severity)}
            interactive={false}
          />
        ))}
      </MapContainer>
      
      {/* Click Overlay */}
      {onClickMap && (
        <div 
          className="absolute inset-0 z-[1000] cursor-pointer hover:bg-black/5 transition-colors"
          onClick={onClickMap}
        />
      )}
    </div>
  );
};
