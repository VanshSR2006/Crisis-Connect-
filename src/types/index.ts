// TEAM OWNERSHIP: MEMBER 3 — BACKEND + DATABASE + SECURITY + REALTIME
// Shared TypeScript entity types — mirrors the SQLAlchemy DB models.
// Coordinate before modifying. Frontend members consume; request changes via PR.
/**
 * Schema-Mirrored TypeScript Definitions for CrisisConnect
 * Strictly aligns with TRD Postgres database entity field names.
 */

export type UserRole = 'citizen' | 'officer' | 'volunteer';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory =
  | 'rescue'
  | 'medical'
  | 'food'
  | 'shelter'
  | 'water'
  | 'flood'
  | 'fire'
  | 'landslide'
  | 'panic'
  | 'other';

export type IncidentStatus = 'reported' | 'acknowledged' | 'dispatched' | 'resolved';

export type ReviewState = 'unverified' | 'flagged' | 'verified';

export type ShelterStatus = 'open' | 'full' | 'closed';

export type ResourceCategory =
  | 'boat'
  | 'medical_kit'
  | 'food_packet'
  | 'vehicle'
  | 'personnel'
  | 'water'
  | 'medical'
  | 'food'
  | 'equipment';

export type ResourceStatus = 'available' | 'reserved' | 'dispatched' | 'depleted';

export type DispatchStatus = 'pending' | 'en_route' | 'on_site' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  zone_id: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  district?: string;
  risk_level: SeverityLevel;
  boundary_geojson: string; // GeoJSON string representation
  population: number;
  created_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: SeverityLevel;
  status: IncidentStatus;
  credibility_score?: number;
  review_state?: ReviewState;
  priority_score?: number;
  lat: number;
  lng: number;
  reported_by_user_id?: string | null;
  zone_id: string;
  created_at: string;
}

export interface Shelter {
  id: string;
  name: string;
  location_name: string;
  lat: number;
  lng: number;
  capacity: number;
  current_occupancy: number;
  status: ShelterStatus;
  contact_number: string;
  zone_id: string;
}

export interface RescueSite {
  id: string;
  name: string;
  building_id?: string;
  shelter_id?: string;
  lat: number;
  lng: number;
  elevation_m: number;
  predicted_flood_margin_m: number;
  capacity: number;
  current_occupancy: number;
  access_status: 'accessible' | 'limited' | 'blocked';
  suitability_score?: number;
  zone_id: string;
}

export interface PopulationProfile {
  id: string;
  zone_id: string;
  population_est: number;
  households_est: number;
  vulnerability_index: number; // 0.0 - 1.0
  updated_at: string;
}

export interface DemandForecast {
  id: string;
  zone_id: string;
  resource_type: 'food' | 'water' | 'medical_kit' | 'sanitation_kit' | 'shelter' | 'other';
  quantity_needed: number;
  confidence: number;
  computed_at: string;
}

export interface SiteRecommendation {
  id: string;
  incident_id: string;
  rescue_site_id: string;
  suitability_score: number;
  reason_breakdown: Record<string, string | number>;
  computed_at: string;
}

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string;
  shelter_id?: string;
  zone_id?: string;
  status: ResourceStatus;
}

export interface Dispatch {
  id: string;
  incident_id: string;
  assigned_user_id: string;
  resource_id?: string;
  status: DispatchStatus;
  dispatched_at: string;
  eta_minutes?: number;
  notes?: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  target_zone_id: string;
  issued_at: string;
  expires_at: string;
  issued_by_user_id: string;
  title_translated?: Record<string, string>;
  message_translated?: Record<string, string>;
}

export interface RiskScore {
  id: string;
  zone_id: string;
  score: number; // 0 - 100
  level: SeverityLevel;
  rainfall_mm: number;
  river_level_m: number;
  computed_at: string;
}
