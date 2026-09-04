import { describe, expect, it, vi, afterEach } from 'vitest';
import * as client from '@/lib/api/client';
import { getShelters } from '@/lib/api/shelters';
import { Shelter } from '@/types';

describe('getShelters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns persisted shelter records from the backend /shelters endpoint', async () => {
    const backendShelters: Shelter[] = [{
      id: 'shelter-delhi-1',
      name: 'Delhi NCR Disaster Evacuation Center',
      location_name: 'Delhi NCR Disaster Evacuation Center',
      lat: 28.6139,
      lng: 77.2090,
      capacity: 1200,
      current_occupancy: 350,
      status: 'open',
      contact_number: '',
      zone_id: 'z-delhi',
    }];
    vi.spyOn(client, 'apiFetch').mockResolvedValue(backendShelters);

    const result = await getShelters();
    expect(result).toEqual(backendShelters);
    expect(client.apiFetch).toHaveBeenCalledWith('/shelters');
  });

  it('safely handles empty array when no shelters exist on backend', async () => {
    vi.spyOn(client, 'apiFetch').mockResolvedValue([]);

    const result = await getShelters();
    expect(result).toEqual([]);
    expect(result).not.toBeNull();
  });
});

describe('nearest shelter distance algorithm', () => {
  const sampleShelters: Shelter[] = [
    {
      id: 'shelter-silchar-1',
      name: 'Silchar District Relief Camp',
      location_name: 'Silchar District Relief Camp',
      lat: 24.8250,
      lng: 92.7950,
      capacity: 500,
      current_occupancy: 150,
      status: 'open',
      contact_number: '',
      zone_id: 'z-silchar',
    },
    {
      id: 'shelter-delhi-1',
      name: 'Delhi NCR Disaster Evacuation Center',
      location_name: 'Delhi NCR Disaster Evacuation Center',
      lat: 28.6139,
      lng: 77.2090,
      capacity: 1200,
      current_occupancy: 350,
      status: 'open',
      contact_number: '',
      zone_id: 'z-delhi',
    },
    {
      id: 'shelter-mumbai-1',
      name: 'Mumbai Coastal Emergency Shelter',
      location_name: 'Mumbai Coastal Emergency Shelter',
      lat: 19.0760,
      lng: 72.8777,
      capacity: 1600,
      current_occupancy: 1600,
      status: 'full', // full shelter
      contact_number: '',
      zone_id: 'z-mumbai',
    },
    {
      id: 'shelter-bengaluru-1',
      name: 'Bengaluru Central Relief Pavilion',
      location_name: 'Bengaluru Central Relief Pavilion',
      lat: 12.9716,
      lng: 77.5946,
      capacity: 1100,
      current_occupancy: 180,
      status: 'open',
      contact_number: '',
      zone_id: 'z-bengaluru',
    },
  ];

  function findNearestShelter(
    shelters: Shelter[],
    targetLat?: number,
    targetLng?: number
  ): Shelter | null {
    const candidates = shelters.filter((s) => s.status === 'open');
    const availableShelters = candidates.length > 0 ? candidates : shelters;
    if (availableShelters.length === 0) return null;

    const effLat = targetLat !== undefined && targetLat !== null && !isNaN(targetLat) ? targetLat : null;
    const effLng = targetLng !== undefined && targetLng !== null && !isNaN(targetLng) ? targetLng : null;

    if (effLat === null || effLng === null) return availableShelters[0];

    return availableShelters.reduce((nearest, shelter) => {
      const nearestDistance = (nearest.lat - effLat) ** 2 + (nearest.lng - effLng) ** 2;
      const shelterDistance = (shelter.lat - effLat) ** 2 + (shelter.lng - effLng) ** 2;
      return shelterDistance < nearestDistance ? shelter : nearest;
    });
  }

  it('recommends Delhi shelter when incident location is in Delhi NCR', () => {
    // Incident in Noida / Delhi NCR
    const incidentLat = 28.5355;
    const incidentLng = 77.3910;

    const nearest = findNearestShelter(sampleShelters, incidentLat, incidentLng);
    expect(nearest).not.toBeNull();
    expect(nearest?.id).toBe('shelter-delhi-1');
  });

  it('recommends Silchar shelter when incident location is in Assam', () => {
    const incidentLat = 24.8200;
    const incidentLng = 92.7900;

    const nearest = findNearestShelter(sampleShelters, incidentLat, incidentLng);
    expect(nearest).not.toBeNull();
    expect(nearest?.id).toBe('shelter-silchar-1');
  });

  it('recommends Bengaluru shelter when incident location is in South India', () => {
    const incidentLat = 13.0000;
    const incidentLng = 77.6000;

    const nearest = findNearestShelter(sampleShelters, incidentLat, incidentLng);
    expect(nearest).not.toBeNull();
    expect(nearest?.id).toBe('shelter-bengaluru-1');
  });

  it('returns null safely when shelter list is empty with no mock fallback', () => {
    const nearest = findNearestShelter([], 28.6139, 77.2090);
    expect(nearest).toBeNull();
  });
});
