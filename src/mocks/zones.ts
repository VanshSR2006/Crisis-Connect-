import { Zone } from '@/types';

export const mockZones: Zone[] = [
  {
    id: 'zone-north-01',
    name: 'Uttarakhand Himalayan Sector',
    code: 'UK-NZ-01',
    risk_level: 'critical',
    boundary_geojson: '{"type":"Polygon","coordinates":[[[77.10,28.60],[77.15,28.60],[77.15,28.65],[77.10,28.65],[77.10,28.60]]]}',
    population: 145000,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'zone-east-02',
    name: 'Assam Brahmaputra Flood Basin',
    code: 'AS-EZ-02',
    risk_level: 'high',
    boundary_geojson: '{"type":"Polygon","coordinates":[[[77.20,28.55],[77.25,28.55],[77.25,28.60],[77.20,28.60],[77.20,28.55]]]}',
    population: 220000,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'zone-south-03',
    name: 'Odisha & Bengal Coastal Belt',
    code: 'OD-CZ-03',
    risk_level: 'medium',
    boundary_geojson: '{"type":"Polygon","coordinates":[[[77.15,28.45],[77.22,28.45],[77.22,28.52],[77.15,28.52],[77.15,28.45]]]}',
    population: 98000,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'zone-central-04',
    name: 'Kerala & Konkan Coastal Zone',
    code: 'KL-WZ-04',
    risk_level: 'low',
    boundary_geojson: '{"type":"Polygon","coordinates":[[[77.05,28.50],[77.12,28.50],[77.12,28.57],[77.05,28.57],[77.05,28.50]]]}',
    population: 310000,
    created_at: '2026-01-01T00:00:00Z',
  },
];
