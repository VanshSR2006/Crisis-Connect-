import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getShelters } from '@/lib/api/shelters';

// Create a custom icon for shelters
const shelterIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'shelter-marker-icon' // Allows custom CSS filtering if needed
});

interface ShelterLayerProps {
  isVisible: boolean;
}

export const ShelterLayer: React.FC<ShelterLayerProps> = ({ isVisible }) => {
  const { data: shelters = [] } = useQuery({
    queryKey: ['shelters'],
    queryFn: getShelters,
    staleTime: 60000,
  });

  if (!isVisible) return null;

  return (
    <>
      {shelters.map((shelter) => (
        <Marker 
          key={shelter.id} 
          position={[shelter.lat, shelter.lng]}
          icon={shelterIcon}
        >
          <Popup className="shelter-popup">
            <div className="p-1 min-w-[200px]">
              <div className="flex items-center justify-between border-b pb-2 mb-2">
                <h4 className="font-bold text-[#1b1b1d] truncate text-sm">{shelter.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  shelter.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 
                  shelter.status === 'full' ? 'bg-orange-100 text-orange-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {shelter.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[#45464d]">
                <div className="flex justify-between">
                  <span className="font-semibold">Capacity:</span>
                  <span>{shelter.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Occupancy:</span>
                  <span className={shelter.current_occupancy >= shelter.capacity ? 'text-[#ba1a1a] font-bold' : ''}>
                    {shelter.current_occupancy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Zone:</span>
                  <span className="font-mono">{shelter.zone_id}</span>
                </div>
                {shelter.contact_number && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Contact:</span>
                    <span>{shelter.contact_number}</span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
