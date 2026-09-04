import { apiFetch } from '@/lib/api/client';

/**
 * Actual backend: POST /rescue-sites/rank
 * 
 * Request: Query parameters (NOT a JSON body):
 *   incident_lat:       float (required)
 *   incident_lng:       float (required)
 *   predicted_flood_m:  float (optional, default 2.0)
 *
 * Response: List[RescueSiteRankResponse]
 *   id                    string
 *   name                  string
 *   lat                   float
 *   lng                   float
 *   elevation_m           float
 *   predicted_flood_margin_m float
 *   capacity              int
 *   current_occupancy     int
 *   access_status         string  ('accessible' | 'limited' | 'blocked')
 *   zone_id               string | null
 *   suitability_score     float
 *   distance_km           float
 *   available_capacity    int
 *   reason_breakdown      Record<string, string>
 */

export interface RescueSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation_m: number;
  predicted_flood_margin_m: number;
  capacity: number;
  current_occupancy: number;
  access_status: 'accessible' | 'limited' | 'blocked';
  zone_id: string | null;
}

export interface RescueSiteRankRequest {
  incident_lat: number;
  incident_lng: number;
  predicted_flood_m?: number; // default 2.0 on backend
}

export interface RankedRescueSite extends RescueSite {
  suitability_score: number;
  distance_km: number;
  available_capacity: number;
  reason_breakdown: Record<string, string>;
}

/**
 * GET /rescue-sites
 * Returns all candidate rescue sites persisted in the system for GIS mapping.
 */
export async function getRescueSites(): Promise<RescueSite[]> {
  const data = await apiFetch<RescueSite[]>('/rescue-sites');
  return data ?? [];
}

/**
 * POST /rescue-sites/rank
 * Uses query params per actual backend contract.
 * Returns sites ranked by the backend's multi-factor suitability model.
 * Throws if the request fails so React Query can surface the error state.
 */
export async function rankRescueSites(req: RescueSiteRankRequest): Promise<RankedRescueSite[]> {
  const params = new URLSearchParams({
    incident_lat: String(req.incident_lat),
    incident_lng: String(req.incident_lng),
  });
  if (req.predicted_flood_m !== undefined) {
    params.append('predicted_flood_m', String(req.predicted_flood_m));
  }

  const data = await apiFetch<RankedRescueSite[]>(`/rescue-sites/rank?${params.toString()}`, {
    method: 'POST',
  });

  if (!data) throw new Error('Unable to load rescue site rankings');
  return data;
}
