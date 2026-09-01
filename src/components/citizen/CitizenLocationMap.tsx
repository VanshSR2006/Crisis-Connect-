import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '@/types';

const DEFAULT_CENTER: [number, number] = [24.8333, 92.7789];

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  height?: string;
}

export const CitizenLocationMap: React.FC<CitizenLocationMapProps> = ({
  incident,
  userLocation,
  height = 'h-48',
}) => {
  const hasIncidentLocation = incident ? isCoordinate(incident.lat, incident.lng) : false;

  if (incident && !hasIncidentLocation) {
    return (
      <div className={`${height} flex items-center justify-center bg-[#f6f3f5] text-center text-xs text-[#45464d]`}>
        Location unavailable for this incident.
      </div>
    );
  }

  const incidentLocation = hasIncidentLocation ? [incident!.lat, incident!.lng] as [number, number] : null;
  const center = incidentLocation ?? userLocation ?? DEFAULT_CENTER;

  return (
    <div className={`${height} w-full`}>
      <MapContainer center={center} zoom={incidentLocation || userLocation ? 15 : 12} scrollWheelZoom className="h-full w-full">
        <MapView center={center} zoom={incidentLocation || userLocation ? 15 : 12} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidentLocation && incident && (
          <Marker position={incidentLocation}>
            <Popup>
              <strong>{incident.title}</strong><br />
              SOS location
            </Popup>
          </Marker>
        )}
        {!incidentLocation && userLocation && (
          <Marker position={userLocation}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
