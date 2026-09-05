import { apiFetch } from '@/lib/api/client';
import { SeverityLevel } from '@/types';

export interface RiskScoreResponse {
  id: string;
  zone_id: string;
  risk_level: SeverityLevel;
  score: number;
  computed_at: string;
  rainfall_mm?: number | null;
  river_level_m?: number | null;
  elevation_m?: number | null;
  soil_saturation?: number | null;
}

/**
 * GET /risk/zones
 * Throws if unreachable.
 */
export async function getRiskScores(): Promise<RiskScoreResponse[]> {
  const data = await apiFetch<RiskScoreResponse[]>('/risk/zones');
  if (!data) throw new Error('Unable to load risk zones');
  return data;
}
