import { Incident, SeverityLevel } from '@/types';
import { LiveRiskZone } from '@/lib/officerContext';

export interface EmergencyVicinity {
  id: string; // unique ID for tracking
  lat: number;
  lng: number;
  radius_m: number;
  sos_count: number;
  highest_severity: SeverityLevel;
  detected_time: string; // ISO timestamp
  estimated_population: number;
  recommended_teams: number;
  status: 'DETECTED' | 'DISPATCH_RECOMMENDED' | 'DISPATCHED';
}

/**
 * Calculates distance in meters between two coordinates using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detects if there is a tight geographic cluster of >= 10 SOS incidents in the last 5 minutes.
 */
export function detectEmergencyCluster(
  incidents: Incident[], 
  riskZones: LiveRiskZone[]
): EmergencyVicinity | null {
  const THRESHOLD = 10;
  const RADIUS_M = 500;
  const TIME_WINDOW_MINS = 5;

  const now = new Date();
  
  // 1. Filter relevant active incidents (unresolved) in the time window
  const recentSOS = incidents.filter(i => {
    if (i.status === 'resolved') return false;
    const createdAt = new Date(i.created_at);
    const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMins <= TIME_WINDOW_MINS;
  });

  if (recentSOS.length < THRESHOLD) {
    return null; // Not enough recent reports to form a cluster
  }

  // 2. Simple clustering: check if any recent incident has >= THRESHOLD neighbours within RADIUS_M
  for (let i = 0; i < recentSOS.length; i++) {
    const centerInc = recentSOS[i];
    const cluster: Incident[] = [];

    for (let j = 0; j < recentSOS.length; j++) {
      const other = recentSOS[j];
      const dist = calculateHaversineDistanceMeters(centerInc.lat, centerInc.lng, other.lat, other.lng);
      if (dist <= RADIUS_M) {
        cluster.push(other);
      }
    }

    if (cluster.length >= THRESHOLD) {
      // 3. Cluster detected. Calculate the geographic center of the cluster.
      const avgLat = cluster.reduce((sum, inc) => sum + inc.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, inc) => sum + inc.lng, 0) / cluster.length;
      
      // Determine highest severity in cluster
      const severities: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];
      const highestSeverity = cluster.reduce((highest, inc) => {
        const idx1 = severities.indexOf(inc.severity);
        const idx2 = severities.indexOf(highest);
        return idx1 > idx2 ? inc.severity : highest;
      }, 'low' as SeverityLevel);

      // 4. Estimate population based on the most frequent zone in the cluster
      const zoneCounts: Record<string, number> = {};
      let topZoneId = centerInc.zone_id;
      let maxCount = 0;
      for (const inc of cluster) {
        if (!inc.zone_id) continue;
        zoneCounts[inc.zone_id] = (zoneCounts[inc.zone_id] || 0) + 1;
        if (zoneCounts[inc.zone_id] > maxCount) {
          maxCount = zoneCounts[inc.zone_id];
          topZoneId = inc.zone_id;
        }
      }

      const matchingZone = riskZones.find(z => z.zone_id === topZoneId);
      
      // If we don't have perfect geometry intersections, use the zone's population directly.
      // If none found, fallback to 800.
      const estimated_population = matchingZone ? matchingZone.population_est : 850;

      // 5. Recommend rescue teams: e.g. <= 500 -> 1 team, 501-1000 -> 2 teams, > 1000 -> 3 teams
      let recommended_teams = 1;
      if (estimated_population > 1000) recommended_teams = 3;
      else if (estimated_population > 500) recommended_teams = 2;

      return {
        id: `vicinity-${avgLat.toFixed(4)}-${avgLng.toFixed(4)}`,
        lat: avgLat,
        lng: avgLng,
        radius_m: RADIUS_M,
        sos_count: cluster.length,
        highest_severity: highestSeverity,
        detected_time: now.toISOString(),
        estimated_population,
        recommended_teams,
        status: 'DETECTED',
      };
    }
  }

  return null;
}
