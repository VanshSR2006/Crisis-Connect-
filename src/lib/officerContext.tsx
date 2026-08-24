// TEAM OWNERSHIP: MEMBER 2 — OFFICER DASHBOARD + GIS
// Officer global state: incidents, dispatches, resources, risk zones, resource pressure.
// Coordinate before modifying outside this workstream.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Incident, Dispatch, Resource, IncidentStatus, SeverityLevel } from '@/types';
import { mockDispatches } from '@/mocks';
import { getIncidents, updateIncidentStatus as persistIncidentStatus } from '@/lib/api/incidents';
import { getRiskScores } from '@/lib/api/risk';
import { getZones } from '@/lib/api/zones';
import { getResources } from '@/lib/api/resources';
import { getZoneDemand, ZoneDemandResponse } from '@/lib/api/demand';
import { createDispatch as persistDispatch } from '@/lib/api/dispatches';

// ── Exported Types ─────────────────────────────────────────────────────────────

export interface LiveRiskZone {
  id: string; // risk score record ID
  zone_id: string;
  name: string;
  risk_level: SeverityLevel;
  score: number;
  computed_at: string;
  boundary_json: string | null;
  population_est: number;
}

/**
 * Resource category pressure for a single category within a zone.
 * "available" and "demand" may be null if one side is unavailable.
 * Missing ≠ zero — do not treat null as 0.
 */
export interface CategoryPressure {
  category: string;         // e.g. 'food', 'medical', 'water'
  unit: string;             // unit of measure for display
  available: number | null; // from GET /resources (sum of zone resources in category), null if no data
  demand: number | null;    // from GET /zones/{id}/demand, null if unavailable
  gap: number | null;       // available - demand; null if either side is null
  status: 'adequate' | 'under_pressure' | 'critical' | 'no_supply' | 'no_demand' | 'unknown';
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

function deriveOverallStatus(cats: CategoryPressure[]): ZoneResourcePressure['overallStatus'] {
  if (cats.some(c => c.status === 'critical')) return 'critical';
  if (cats.some(c => c.status === 'under_pressure')) return 'under_pressure';
  if (cats.every(c => c.status === 'adequate')) return 'adequate';
  return 'unknown';
}

/**
 * Build ZoneResourcePressure view models from supply and demand data.
 * Categories matched:
 *   - food:    demand.food_packets      vs  sum of resources where type = 'food' or 'food_packet'
 *   - medical: demand.medical_kits      vs  sum of resources where type = 'medical' or 'medical_kit'
 *   - water:   demand.drinking_water_liters vs sum of resources where type = 'water'
 */
function buildPressureModels(
  zones: Array<{ id: string; name: string; boundary_json: string | null }>,
  resources: Resource[],
  demandMap: Map<string, ZoneDemandResponse>
): ZoneResourcePressure[] {
  return zones.map(zone => {
    const zoneResources = resources.filter(r => r.zone_id === zone.id);
    const demand = demandMap.get(zone.id) ?? null;

    const hasSupplyData = zoneResources.length > 0;
    const hasDemandData = demand !== null;

    // Sum resources by category for this zone
    const sumCat = (types: string[]) =>
      hasSupplyData
        ? zoneResources
            .filter(r => types.includes(r.category))
            .reduce((acc, r) => acc + (r.quantity ?? 0), 0)
        : null;

    const foodAvailable = sumCat(['food', 'food_packet']);
    const medicalAvailable = sumCat(['medical', 'medical_kit']);
    const waterAvailable = sumCat(['water']);

    const foodDemand = demand?.food_packets ?? null;
    const medicalDemand = demand?.medical_kits ?? null;
    const waterDemand = demand?.drinking_water_liters ?? null;

    const categories: CategoryPressure[] = [
      {
        category: 'Food',
        unit: 'packets',
        available: foodAvailable,
        demand: foodDemand,
        gap: foodAvailable !== null && foodDemand !== null ? foodAvailable - foodDemand : null,
        status: deriveCategoryStatus(foodAvailable, foodDemand),
      },
      {
        category: 'Medical',
        unit: 'kits',
        available: medicalAvailable,
        demand: medicalDemand,
        gap: medicalAvailable !== null && medicalDemand !== null ? medicalAvailable - medicalDemand : null,
        status: deriveCategoryStatus(medicalAvailable, medicalDemand),
      },
      {
        category: 'Water',
        unit: 'liters',
        available: waterAvailable,
        demand: waterDemand,
        gap: waterAvailable !== null && waterDemand !== null ? waterAvailable - waterDemand : null,
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

  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;

  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;

  updateIncidentStatus: (id: string, status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>) => Promise<void>;
  createDispatch: (payload: CreateDispatchPayload) => Promise<Dispatch | null>;

  isCrisisMode: boolean;
  setIsCrisisMode: (isCrisis: boolean) => void;
}

const OfficerContext = createContext<OfficerContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

export const OfficerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // ── Incidents query ────────────────────────────────────────────────────────
  const { data: liveIncidents, isLoading: isLoadingIncidents, isError: isErrorIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: getIncidents,
  });
  const incidents = liveIncidents ?? [];

  // ── Risk zones query (Phase 3) ─────────────────────────────────────────────
  const { data: liveRiskZones, isLoading: isLoadingRisk, isError: isErrorRisk } = useQuery({
    queryKey: ['risk_zones'],
    queryFn: async () => {
      const [scores, zones] = await Promise.all([getRiskScores(), getZones()]);
      const merged: LiveRiskZone[] = scores.map(score => {
        const zone = zones.find(z => z.id === score.zone_id);
        return {
          id: score.id,
          zone_id: score.zone_id,
          name: zone?.name || score.zone_id,
          risk_level: score.risk_level as SeverityLevel,
          score: score.score,
          computed_at: score.computed_at,
          boundary_json: zone?.boundary_json || null,
          population_est: zone?.population_est || 0,
        };
      });
      return merged;
    },
    refetchInterval: 30000,
  });
  const riskZones = liveRiskZones ?? [];

  // ── Live resources query ───────────────────────────────────────────────────
  const {
    data: liveResources,
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useQuery({
    queryKey: ['resources'],
    queryFn: getResources,
    refetchInterval: 60000, // Refresh every minute; also invalidated by resource.updated WS
  });
  const resources = liveResources ?? [];

  // ── Zone pressure query: fetches zones + demands in parallel ───────────────
  const {
    data: liveZonePressure,
    isLoading: isLoadingPressure,
    isError: isErrorPressure,
  } = useQuery({
    queryKey: ['zone_pressure'],
    queryFn: async () => {
      const zones = await getZones();
      if (!zones || zones.length === 0) return [];

      // Fetch all demands in parallel; individual failures set demandMap entries to null
      const demandMap = new Map<string, ZoneDemandResponse>();
      const demandResults = await Promise.allSettled(
        zones.map(z => getZoneDemand(z.id))
      );
      demandResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          demandMap.set(zones[idx].id, result.value);
        }
        // On rejection: zone stays missing from map — treated as no demand data
      });

      // At this point resources may not yet be fetched, use queryClient cache
      const cachedResources =
        queryClient.getQueryData<Resource[]>(['resources']) ?? [];

      return buildPressureModels(zones, cachedResources, demandMap);
    },
    enabled: !isLoadingResources, // wait for resources to be available
    staleTime: 60000,
  });
  const zonePressure = liveZonePressure ?? [];

  const [dispatches, setDispatches] = useState<Dispatch[]>(mockDispatches);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isCrisisMode, setIsCrisisMode] = useState<boolean>(false);

  // Set initial selected incident once data loads
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  // ── WebSocket Integration ──────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace('http', 'ws') + '/ws/dashboard'
      : 'ws://localhost:8000/ws/dashboard';

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const url = `${wsUrl}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(url);

      ws.onmessage = (event) => {
        try {
          if (event.data.startsWith('ACK:')) return;
          const data = JSON.parse(event.data);

          if (data.type === 'incident.created' || data.type === 'incident.verified' || data.type === 'incident.updated') {
            const payload = data.payload;
            queryClient.setQueryData<Incident[]>(['incidents'], (old) => {
              if (!old) return old;
              const exists = old.some(i => i.id === payload.id);
              if (exists) {
                const updated = old.map(i => i.id === payload.id ? { ...i, ...payload } : i);
                return updated.sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
              } else {
                queryClient.invalidateQueries({ queryKey: ['incidents'] });
                return old;
              }
            });
          }

          // resource.updated (broadcast from dispatch.py when resource changes)
          if (data.type === 'resource.updated') {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            // Also invalidate zone_pressure since supply side changed
            queryClient.invalidateQueries({ queryKey: ['zone_pressure'] });
          }
        } catch (e) {
          console.error('WS Parse error', e);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        if (event.code === 4401 || event.code === 4403) return;
        reconnectTimer = setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [queryClient]);

  const updateIncidentStatus = async (
    id: string,
    status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
  ) => {
    const updatedIncident = await persistIncidentStatus(id, status);
    if (!updatedIncident) return;

    queryClient.setQueryData<Incident[]>(['incidents'], (old) => {
      if (!old) return old;
      return old.map(i => i.id === id ? updatedIncident : i);
    });
  };

  const createDispatch = async (payload: CreateDispatchPayload): Promise<Dispatch | null> => {
    const newDispatch = await persistDispatch({
      incident_id: payload.incidentId,
      resource_id: payload.resourceId,
      assigned_user_id: payload.assignedUserId,
      notes: payload.notes,
    });
    if (!newDispatch) return null;

    setDispatches((prev) => [newDispatch, ...prev]);
    // The dispatch endpoint commits Incident.status = "dispatched". Refetch it
    // instead of manufacturing a frontend-only incident status.
    await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    return newDispatch;
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
        selectedIncidentId,
        setSelectedIncidentId,
        selectedZoneId,
        setSelectedZoneId,
        updateIncidentStatus,
        createDispatch,
        isCrisisMode,
        setIsCrisisMode,
      }}
    >
      {children}
    </OfficerContext.Provider>
  );
};

export const useOfficerContext = (): OfficerContextType => {
  const context = useContext(OfficerContext);
  if (!context) {
    throw new Error('useOfficerContext must be used within an OfficerProvider');
  }
  return context;
};
