import { apiFetch } from '@/lib/api/client';

export interface ZoneResponse {
  id: string;
  name: string;
  district: string | null;
  boundary_json: string | null;
  population_est: number;
}

/**
 * GET /zones
 * Throws if unreachable.
 */
export async function getZones(): Promise<ZoneResponse[]> {
  const data = await apiFetch<ZoneResponse[]>('/zones');
  if (!data) throw new Error('Unable to load zones');
  return data;
}
