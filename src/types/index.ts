/**
 * Schema-Mirrored TypeScript Definitions for CrisisConnect
 * Strictly aligns with TRD Postgres database entity field names.
 */

export type UserRole = 'citizen' | 'officer' | 'volunteer';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type IncidentCategory = 'flood' | 'fire' | 'landslide' | 'medical' | 'rescue';

export type IncidentStatus = 'reported' | 'acknowledged' | 'dispatched' | 'resolved';

export type ShelterStatus = 'open' | 'full' | 'closed';

export type ResourceCategory = 'food' | 'medical' | 'vehicle' | 'water' | 'equipment';

export type ResourceStatus = 'available' | 'reserved' | 'depleted';

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
  lat: number;
  lng: number;
  reported_by_user_id: string;
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

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string;
  shelter_id: string;
  status: ResourceStatus;
}

export interface Dispatch {
  id: string;
  incident_id: string;
  assigned_user_id: string;
  status: DispatchStatus;
  dispatched_at: string;
  notes: string;
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
