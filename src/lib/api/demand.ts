import { apiFetch } from '@/lib/api/client';

export interface ZoneDemand {
  food_packets: number;
  drinking_water_liters: number;
  medical_kits: number;
  sanitation_kits: number;
  population: number;
  households: number;
  vulnerability_index: number;
}

export interface ZoneShortage {
  resource_type: string;
  required: number;
  available: number;
  shortage: number;
  status: string;
  reorder_required: boolean;
}

export interface ZoneDemandResponse {
  zone_id: string;
  demand: ZoneDemand;
  total_shortage: number;
  shortages: ZoneShortage[];
}

/**
 * GET /zones/{id}/demand
 * Throws if the backend is unreachable.
 */
export async function getZoneDemand(zoneId: string): Promise<ZoneDemandResponse> {
  const data = await apiFetch<ZoneDemandResponse>(`/zones/${zoneId}/demand`);
  if (!data) throw new Error(`Unable to load demand for zone ${zoneId}`);
  return data;
}
