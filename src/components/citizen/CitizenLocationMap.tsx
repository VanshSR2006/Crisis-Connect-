import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Shelter } from '@/types';

const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090];

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const shelterMarkerIcon = typeof L?.icon === 'function' ? L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'shelter-citizen-marker'
}) : undefined;

const isCoordinate = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const MapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  return null;
};

interface CitizenLocationMapProps {
  incident: Incident | null;
  userLocation: [number, number] | null;
  shelters?: Shelter[];
  height?: string;
}

export const CitizenLocationMap: React.FC<CitizenLocationMapProps> = ({
  incident,
  userLocation,
  shelters = [],
  height = 'h-[260px] md:h-[340px]',
}) => {
  const hasIncidentLocation = incident ? isCoordinate(incident.lat, incident.lng) : false;

  if (incident && !hasIncidentLocation) {
    return (
      <div className="w-full h-[260px] md:h-[340px] flex items-center justify-center bg-[#f6f3f5] text-center text-xs text-[#45464d] rounded-md">
        Location unavailable for this incident.
      </div>
    );
  }

  const incidentLocation = hasIncidentLocation ? [incident!.lat, incident!.lng] as [number, number] : null;
  const center = incidentLocation ?? userLocation ?? DEFAULT_CENTER;

  const validShelters = shelters.filter(s => isCoordinate(s.lat, s.lng));

  return (
    <div className="w-full h-[260px] md:h-[340px] rounded-md overflow-hidden">
      <MapContainer center={center} zoom={incidentLocation || userLocation ? 14 : 11} scrollWheelZoom className="h-full w-full">
        <MapView center={center} zoom={incidentLocation || userLocation ? 14 : 11} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Incident location marker */}
        {incidentLocation && incident && (
          <Marker position={incidentLocation}>
            <Popup>
              <strong>{incident.title}</strong><br />
              SOS Emergency Location
            </Popup>
          </Marker>
        )}
        {/* User location marker */}
        {!incidentLocation && userLocation && (
          <Marker position={userLocation}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
        {/* Evacuation shelter markers */}
        {validShelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.lat, shelter.lng]}
            icon={shelterMarkerIcon}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[140px]">
                <strong className="block text-slate-900 font-bold">{shelter.name}</strong>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${shelter.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {shelter.status === 'open' ? 'Open' : 'Full'}
                </span>
                <p className="text-slate-600">
                  {shelter.capacity - shelter.current_occupancy} / {shelter.capacity} beds free
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
