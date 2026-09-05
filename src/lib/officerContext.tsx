// TEAM OWNERSHIP: MEMBER 2 — OFFICER DASHBOARD + GIS
// Officer global state: incidents, dispatches, resources, risk zones, resource pressure.
// Coordinate before modifying outside this workstream.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Incident, Dispatch, Resource, IncidentStatus, SeverityLevel } from '@/types';
import { getIncidents, updateIncidentStatus as persistIncidentStatus } from '@/lib/api/incidents';
import { getRiskScores } from '@/lib/api/risk';
import { getZones } from '@/lib/api/zones';
import { getResources } from '@/lib/api/resources';
import { getZoneDemand, ZoneDemandResponse } from '@/lib/api/demand';
import {
  getDispatches,
  createDispatch as persistDispatch,
  createTeamDispatch as persistTeamDispatch,
} from '@/lib/api/dispatches';
import { realtimeClient } from '@/lib/api/websocket';
import { normalizeRiskScore } from '@/lib/utils/risk';
import { detectEmergencyCluster, EmergencyVicinity } from '@/lib/officer/emergencyDetection';

// ── Exported Types ─────────────────────────────────────────────────────────────

export interface LiveRiskZone {
  id: string;
  zone_id: string;
  name: string;
  risk_level: SeverityLevel;
  score: number;
  computed_at: string;
  boundary_json: string | null;
  population_est: number;
  rainfall_mm?: number | null;
  river_level_m?: number | null;
  elevation_m?: number | null;
  soil_saturation?: number | null;
  factors?: {
    rainfall?: string;
    drainage?: string;
    population?: string;
    river_level?: string;
    elevation?: string;
    soil_saturation?: string;
  };
}

/**
 * Resource category pressure for a single category within a zone.
 * "available" and "demand" may be null if one side is unavailable.
 * Missing ≠ zero — do not treat null as 0.
 */
export interface CategoryPressure {
  category: string;
  unit: string;
  available: number | null;
  demand: number | null;
  gap: number | null;
  status:
    | 'adequate'
    | 'under_pressure'
    | 'critical'
    | 'no_supply'
    | 'no_demand'
    | 'unknown';
}

/**
 * Zone-level resource pressure view model.
 * Derived from the merge of resource supply and zone demand data.
 */
export interface ZoneResourcePressure {
  zone_id: string;
  name: string;
  boundary_json: string | null;
  categories: CategoryPressure[];
  overallStatus: 'adequate' | 'under_pressure' | 'critical' | 'unknown';
  hasDemandData: boolean;
  hasSupplyData: boolean;
}

// ── Pressure Derivation ────────────────────────────────────────────────────────

function deriveCategoryStatus(
  available: number | null,
  demand: number | null
): CategoryPressure['status'] {
  if (available === null && demand === null) return 'unknown';
  if (available === null) return 'no_supply';
  if (demand === null) return 'no_demand';
  if (available >= demand) return 'adequate';

  const gapRatio = (demand - available) / demand;

  if (gapRatio >= 0.5) return 'critical';

  return 'under_pressure';
}

function deriveOverallStatus(
  cats: CategoryPressure[]
): ZoneResourcePressure['overallStatus'] {
  if (cats.some(c => c.status === 'critical')) return 'critical';
  if (cats.some(c => c.status === 'under_pressure')) return 'under_pressure';
  if (cats.every(c => c.status === 'adequate')) return 'adequate';

  return 'unknown';
}

/**
 * Build ZoneResourcePressure view models from supply and demand data.
 *
 * Categories matched:
 *   - food: demand.food_packets vs resources where type = food / food_packet
 *   - medical: demand.medical_kits vs resources where type = medical / medical_kit
 *   - water: demand.drinking_water_liters vs resources where type = water
 */
function buildPressureModels(
  zones: Array<{
    id: string;
    name: string;
    boundary_json: string | null;
  }>,
  resources: Resource[],
  demandMap: Map<string, ZoneDemandResponse>
): ZoneResourcePressure[] {
  return zones.map(zone => {
    const zoneResources = resources.filter(r => r.zone_id === zone.id);
    const demand = demandMap.get(zone.id) ?? null;

    const hasSupplyData = zoneResources.length > 0;
    const hasDemandData = demand !== null;

    const sumCat = (types: string[]) =>
      hasSupplyData
        ? zoneResources
            .filter(r => types.includes(r.category))
            .reduce((acc, r) => acc + (r.quantity ?? 0), 0)
        : null;

    const foodAvailable = sumCat(['food', 'food_packet']);
    const medicalAvailable = sumCat(['medical', 'medical_kit']);
    const waterAvailable = sumCat(['water']);

    const foodDemand = demand?.demand?.food_packets ?? null;
    const medicalDemand = demand?.demand?.medical_kits ?? null;
    const waterDemand = demand?.demand?.drinking_water_liters ?? null;

    const categories: CategoryPressure[] = [
      {
        category: 'Food',
        unit: 'packets',
        available: foodAvailable,
        demand: foodDemand,
        gap:
          foodAvailable !== null && foodDemand !== null
            ? foodAvailable - foodDemand
            : null,
        status: deriveCategoryStatus(foodAvailable, foodDemand),
      },
      {
        category: 'Medical',
        unit: 'kits',
        available: medicalAvailable,
        demand: medicalDemand,
        gap:
          medicalAvailable !== null && medicalDemand !== null
            ? medicalAvailable - medicalDemand
            : null,
        status: deriveCategoryStatus(medicalAvailable, medicalDemand),
      },
      {
        category: 'Water',
        unit: 'liters',
        available: waterAvailable,
        demand: waterDemand,
        gap:
          waterAvailable !== null && waterDemand !== null
            ? waterAvailable - waterDemand
            : null,
        status: deriveCategoryStatus(waterAvailable, waterDemand),
      },
    ];

    return {
      zone_id: zone.id,
      name: zone.name,
      boundary_json: zone.boundary_json,
      categories,
      overallStatus: deriveOverallStatus(categories),
      hasDemandData,
      hasSupplyData,
    };
  });
}

// ── Context Types ──────────────────────────────────────────────────────────────

interface CreateDispatchPayload {
  incidentId: string;
  assignedUserId: string;
  resourceId?: string;
  notes: string;
}

interface CreateTeamDispatchPayload {
  incidentId: string;
  volunteerIds: string[];
  resourceId?: string;
  etaMinutes?: number;
  notes: string;
}

interface OfficerContextType {
  incidents: Incident[];
  isLoadingIncidents: boolean;
  isErrorIncidents: boolean;

  riskZones: LiveRiskZone[];
  isLoadingRisk: boolean;
  isErrorRisk: boolean;

  resources: Resource[];
  isLoadingResources: boolean;
  isErrorResources: boolean;

  zonePressure: ZoneResourcePressure[];
  isLoadingPressure: boolean;
  isErrorPressure: boolean;

  dispatches: Dispatch[];
  isLoadingDispatches: boolean;
  isErrorDispatches: boolean;

  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;

  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;

  updateIncidentStatus: (
    id: string,
    status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
  ) => Promise<void>;

  createDispatch: (
    payload: CreateDispatchPayload
  ) => Promise<Dispatch | null>;

  createTeamDispatch: (
    payload: CreateTeamDispatchPayload
  ) => Promise<Dispatch[]>;

  isCrisisMode: boolean;
  setIsCrisisMode: (isCrisis: boolean) => void;

  activeVicinity: EmergencyVicinity | null;
  dismissVicinity: () => void;
}

const OfficerContext = createContext<OfficerContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

export const OfficerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  // ── Incidents query ────────────────────────────────────────────────────────

  const {
    data: liveIncidents,
    isLoading: isLoadingIncidents,
    isError: isErrorIncidents,
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: getIncidents,
  });

  const incidents = liveIncidents ?? [];

  // ── Risk zones query ──────────────────────────────────────────────────────

  const {
    data: liveRiskZones,
    isLoading: isLoadingRisk,
    isError: isErrorRisk,
  } = useQuery({
    queryKey: ['risk_zones'],
    queryFn: async () => {
      const [scores, zones] = await Promise.all([
        getRiskScores(),
        getZones(),
      ]);

      const merged: LiveRiskZone[] = scores.map(score => {
        const zone = zones.find(z => z.id === score.zone_id);

        return {
          id: score.id,
          zone_id: score.zone_id,
          name: zone?.name || score.zone_id,
          risk_level: score.risk_level as SeverityLevel,
          score: normalizeRiskScore(score.score),
          computed_at: score.computed_at,
          boundary_json: zone?.boundary_json || null,
          population_est: zone?.population_est || 0,
          rainfall_mm: score.rainfall_mm ?? null,
          river_level_m: score.river_level_m ?? null,
          elevation_m: score.elevation_m ?? 20.0,
          soil_saturation: score.soil_saturation ?? 0.5,
          factors: {
            rainfall:
              score.rainfall_mm != null
                ? `${score.rainfall_mm} mm`
                : undefined,
            river_level:
              score.river_level_m != null
                ? `${score.river_level_m} m`
                : undefined,
            elevation:
              score.elevation_m != null
                ? `${score.elevation_m} m`
                : '20.0 m',
            soil_saturation:
              score.soil_saturation != null
                ? `${Math.round(score.soil_saturation * 100)}%`
                : '50%',
          },
        };
      });

      // Deduplicate by zone_id — keep the entry with highest score.
      const deduped = new Map<string, LiveRiskZone>();

      for (const entry of merged) {
        const existing = deduped.get(entry.zone_id);

        if (!existing || entry.score > existing.score) {
          deduped.set(entry.zone_id, entry);
        }
      }

      return Array.from(deduped.values());
    },
    refetchInterval: 30000,
  });

  const riskZones = liveRiskZones ?? [];

  // ── Live resources query ─────────────────────────────────────────────────

  const {
    data: liveResources,
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useQuery({
    queryKey: ['resources'],
    queryFn: getResources,
    refetchInterval: 60000,
  });

  const resources = liveResources ?? [];

  // ── Zone pressure query ──────────────────────────────────────────────────

  const {
    data: liveZonePressure,
    isLoading: isLoadingPressure,
    isError: isErrorPressure,
  } = useQuery({
    queryKey: ['zone_pressure'],
    queryFn: async () => {
      const zones = await getZones();

      if (!zones || zones.length === 0) {
        return [];
      }

      const demandMap = new Map<string, ZoneDemandResponse>();

      const demandResults = await Promise.allSettled(
        zones.map(z => getZoneDemand(z.id))
      );

      demandResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          demandMap.set(zones[idx].id, result.value);
        }
      });

      const cachedResources =
        queryClient.getQueryData<Resource[]>(['resources']) ?? [];

      return buildPressureModels(
        zones,
        cachedResources,
        demandMap
      );
    },
    enabled: !isLoadingResources,
    staleTime: 60000,
  });

  const zonePressure = liveZonePressure ?? [];

  // ── Dispatches query ─────────────────────────────────────────────────────

  const {
    data: liveDispatches,
    isLoading: isLoadingDispatches,
    isError: isErrorDispatches,
  } = useQuery({
    queryKey: ['dispatches'],
    queryFn: getDispatches,
  });

  const dispatches = liveDispatches ?? [];

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isCrisisMode, setIsCrisisMode] = useState<boolean>(false);
  const [activeVicinity, setActiveVicinity] = useState<EmergencyVicinity | null>(null);

  // ── Area Emergency Detection ──────────────────────────────────────────────────
  useEffect(() => {
    // Re-evaluate clusters whenever incidents or riskZones update
    if (incidents.length > 0 && riskZones.length > 0) {
      const vicinity = detectEmergencyCluster(incidents, riskZones);

      if (vicinity) {
        setActiveVicinity(prev => {
          if (prev) {
            return {
              ...prev,
              sos_count: vicinity.sos_count,
              highest_severity: vicinity.highest_severity,
              estimated_population: vicinity.estimated_population,
              recommended_teams: vicinity.recommended_teams,
            };
          }
          setIsCrisisMode(true);
          return vicinity;
        });
      } else {
        setActiveVicinity(null);
      }
    }
  }, [incidents, riskZones]);

  const dismissVicinity = () => setActiveVicinity(null);(Implement volunteer team dispatch)

  // Set initial selected incident once data loads
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  // ── WebSocket Integration ─────────────────────────────────────────────────

  useEffect(() => {
    const handleIncidentEvent = (payload: any) => {
      if (!payload) return;

      queryClient.setQueryData<Incident[]>(
        ['incidents'],
        old => {
          if (!old) return old;

          const exists = old.some(i => i.id === payload.id);

          const updatedList = exists
            ? old.map(i =>
                i.id === payload.id
                  ? { ...i, ...payload }
                  : i
              )
            : [payload as Incident, ...old];

          return updatedList.sort((a, b) => {
            const timeA = a.created_at
              ? new Date(a.created_at).getTime()
              : 0;

            const timeB = b.created_at
              ? new Date(b.created_at).getTime()
              : 0;

            if (timeA !== timeB) {
              return timeB - timeA;
            }

            return (
              (b.priority_score ?? 0) -
              (a.priority_score ?? 0)
            );
          });
        }
      );

      queryClient.invalidateQueries({
        queryKey: ['incidents'],
      });
    };

    const handleResourceUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: ['resources'],
      });

      queryClient.invalidateQueries({
        queryKey: ['zone_pressure'],
      });
    };

    const handleDispatchEvent = () => {
      queryClient.invalidateQueries({
        queryKey: ['dispatches'],
      });
    };

    const unsubCreated = realtimeClient.subscribe(
      'incident.created',
      handleIncidentEvent
    );

    const unsubVerified = realtimeClient.subscribe(
      'incident.verified',
      handleIncidentEvent
    );

    const unsubUpdated = realtimeClient.subscribe(
      'incident.updated',
      handleIncidentEvent
    );

    const unsubResource = realtimeClient.subscribe(
      'resource.updated',
      handleResourceUpdated
    );

    const unsubDispatchAuth = realtimeClient.subscribe(
      'dispatch.authorized',
      handleDispatchEvent
    );

    const unsubDispatchStatus = realtimeClient.subscribe(
      'dispatch.status_changed',
      handleDispatchEvent
    );

    return () => {
      unsubCreated();
      unsubVerified();
      unsubUpdated();
      unsubResource();
      unsubDispatchAuth();
      unsubDispatchStatus();
    };
  }, [queryClient]);

  // ── Incident Status ──────────────────────────────────────────────────────

  const updateIncidentStatus = async (
    id: string,
    status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
  ) => {
    const updatedIncident = await persistIncidentStatus(
      id,
      status
    );

    if (!updatedIncident) return;

    queryClient.setQueryData<Incident[]>(
      ['incidents'],
      old => {
        if (!old) return old;

        return old.map(i =>
          i.id === id ? updatedIncident : i
        );
      }
    );
  };

  // ── Single Volunteer Dispatch ────────────────────────────────────────────

  const createDispatch = async (
    payload: CreateDispatchPayload
  ): Promise<Dispatch | null> => {
    const newDispatch = await persistDispatch({
      incident_id: payload.incidentId,
      resource_id: payload.resourceId,
      assigned_user_id: payload.assignedUserId,
      notes: payload.notes,
    });

    if (!newDispatch) return null;

    await queryClient.invalidateQueries({
      queryKey: ['dispatches'],
    });

    await queryClient.invalidateQueries({
      queryKey: ['incidents'],
    });

    return newDispatch;
  };

  // ── Multiple Volunteer Team Dispatch ─────────────────────────────────────

  const createTeamDispatch = async (
    payload: CreateTeamDispatchPayload
  ): Promise<Dispatch[]> => {
    const newDispatches = await persistTeamDispatch({
      incident_id: payload.incidentId,
      volunteer_ids: payload.volunteerIds,
      resource_id: payload.resourceId,
      eta_minutes: payload.etaMinutes,
      notes: payload.notes,
    });

    await queryClient.invalidateQueries({
      queryKey: ['dispatches'],
    });

    await queryClient.invalidateQueries({
      queryKey: ['incidents'],
    });

    await queryClient.invalidateQueries({
      queryKey: ['resources'],
    });

    await queryClient.invalidateQueries({
      queryKey: ['zone_pressure'],
    });

    return newDispatches;
  };

  return (
    <OfficerContext.Provider
      value={{
        incidents,
        isLoadingIncidents,
        isErrorIncidents,

        riskZones,
        isLoadingRisk,
        isErrorRisk,

        resources,
        isLoadingResources,
        isErrorResources,

        zonePressure,
        isLoadingPressure,
        isErrorPressure,

        dispatches,
        isLoadingDispatches,
        isErrorDispatches,

        selectedIncidentId,
        setSelectedIncidentId,

        selectedZoneId,
        setSelectedZoneId,

        updateIncidentStatus,
        createDispatch,
        createTeamDispatch,

        isCrisisMode,
        setIsCrisisMode,
        activeVicinity,
        dismissVicinity,
      }}
    >
      {children}
    </OfficerContext.Provider>
  );
};

export const useOfficerContext = (): OfficerContextType => {
  const context = useContext(OfficerContext);

  if (!context) {
    throw new Error(
      'useOfficerContext must be used within an OfficerProvider'
    );
  }

  return context;
};