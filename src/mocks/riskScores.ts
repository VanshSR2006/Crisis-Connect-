import { RiskScore } from '@/types';

export const mockRiskScores: RiskScore[] = [
  {
    id: 'rsk-901',
    zone_id: 'zone-north-01',
    score: 94,
    level: 'critical',
    rainfall_mm: 112.5,
    river_level_m: 206.12,
    computed_at: '2026-07-30T20:00:00Z',
  },
  {
    id: 'rsk-902',
    zone_id: 'zone-east-02',
    score: 78,
    level: 'high',
    rainfall_mm: 88.0,
    river_level_m: 204.85,
    computed_at: '2026-07-30T20:00:00Z',
  },
  {
    id: 'rsk-903',
    zone_id: 'zone-south-03',
    score: 52,
    level: 'medium',
    rainfall_mm: 45.2,
    river_level_m: 203.10,
    computed_at: '2026-07-30T20:00:00Z',
  },
  {
    id: 'rsk-904',
    zone_id: 'zone-central-04',
    score: 18,
    level: 'low',
    rainfall_mm: 12.0,
    river_level_m: 201.50,
    computed_at: '2026-07-30T20:00:00Z',
  },
];
