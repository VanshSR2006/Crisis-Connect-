import { apiFetch } from '@/lib/api/client';

/**
 * Backend DemandResponse fields (GET /zones/{id}/demand):
 *   food_packets, drinking_water_liters, medical_kits, sanitation_kits,
 *   population, households, vulnerability_index
 *
 * This is the verbatim backend response — no fields are invented.
 */
export interface ZoneDemandResponse {
  food_packets: number;
  drinking_water_liters: number;
  medical_kits: number;
  sanitation_kits: number;
  population: number;
  households: number;
  vulnerability_index: number;
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
