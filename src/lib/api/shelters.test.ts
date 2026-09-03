import { describe, expect, it, vi } from 'vitest';
import * as client from '@/lib/api/client';
import { getShelters } from '@/lib/api/shelters';

describe('getShelters', () => {
  it('returns persisted shelter records from the shelters endpoint', async () => {
    const shelters = [{
      id: 'shelter-1', name: 'Shelter', location_name: 'Shelter', lat: 24.8, lng: 92.8,
      capacity: 100, current_occupancy: 25, status: 'open', contact_number: '', zone_id: 'z-1',
    }];
    vi.spyOn(client, 'apiFetch').mockResolvedValue(shelters);

    await expect(getShelters()).resolves.toEqual(shelters);
    expect(client.apiFetch).toHaveBeenCalledWith('/shelters');
  });
});
