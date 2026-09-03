// TEAM OWNERSHIP: MEMBER 2 — OFFICER DASHBOARD + GIS
// Officer global state: incidents, dispatches, resources, risk zones, resource pressure.
// Coordinate before modifying outside this workstream.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Incident,
  Dispatch,
  Resource,
  IncidentStatus,
  DispatchStatus,
  SeverityLevel,
} from '@/types';

import { mockDispatches } from '@/mocks';

import {
  getIncidents,
  updateIncidentStatus as persistIncidentStatus,
} from '@/lib/api/incidents';
import { getRiskScores } from '@/lib/api/risk';
import { getZones } from '@/lib/api/zones';
import { getResources } from '@/lib/api/resources';
import { getZoneDemand, ZoneDemandResponse } from '@/lib/api/demand';
import { getDispatches, createDispatch as persistDispatch } from '@/lib/api/dispatches';
import { realtimeClient } from '@/lib/api/websocket';
import { normalizeRiskScore } from '@/lib/utils/risk';

import {
  getDispatches,
  createDispatch as createDispatchApi,
} from '@/lib/api/dispatches';

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveRiskZone {
  id: string;
  zone_id: string;
  name: string;
  risk_level: SeverityLevel;
  score: number;
  computed_at: string;
  boundary_json: string | null;
  population_est: number;
}

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

export interface ZoneResourcePressure {
  zone_id: string;
  name: string;
  boundary_json: string | null;
  categories: CategoryPressure[];

  overallStatus:
    | 'adequate'
    | 'under_pressure'
    | 'critical'
    | 'unknown';

  hasDemandData: boolean;
  hasSupplyData: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESSURE DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function deriveCategoryStatus(
  available: number | null,
  demand: number | null
): CategoryPressure['status'] {
  if (available === null && demand === null) {
    return 'unknown';
  }

  if (available === null) {
    return 'no_supply';
  }

  if (demand === null) {
    return 'no_demand';
  }

  if (available >= demand) {
    return 'adequate';
  }

  const gapRatio = (demand - available) / demand;

  if (gapRatio >= 0.5) {
    return 'critical';
  }

  return 'under_pressure';
}

function deriveOverallStatus(
  cats: CategoryPressure[]
): ZoneResourcePressure['overallStatus'] {
  if (cats.some((c) => c.status === 'critical')) {
    return 'critical';
  }

  if (cats.some((c) => c.status === 'under_pressure')) {
    return 'under_pressure';
  }

  if (cats.every((c) => c.status === 'adequate')) {
    return 'adequate';
  }

  return 'unknown';
}

function buildPressureModels(
  zones: Array<{
    id: string;
    name: string;
    boundary_json: string | null;
  }>,
  resources: Resource[],
  demandMap: Map<string, ZoneDemandResponse>
): ZoneResourcePressure[] {
  return zones.map((zone) => {
    const zoneResources = resources.filter(
      (r) => r.zone_id === zone.id
    );

    const demand = demandMap.get(zone.id) ?? null;

    const hasSupplyData = zoneResources.length > 0;
    const hasDemandData = demand !== null;

    const sumCat = (types: string[]) => {
      if (!hasSupplyData) {
        return null;
      }

      return zoneResources
        .filter((r) => types.includes(r.category))
        .reduce(
          (acc, r) => acc + (r.quantity ?? 0),
          0
        );
    };

    const foodAvailable = sumCat([
      'food',
      'food_packet',
    ]);

    const medicalAvailable = sumCat([
      'medical',
      'medical_kit',
    ]);

    const waterAvailable = sumCat([
      'water',
    ]);

    const foodDemand =
      demand?.food_packets ?? null;

    const medicalDemand =
      demand?.medical_kits ?? null;

    const waterDemand =
      demand?.drinking_water_liters ?? null;

    const categories: CategoryPressure[] = [
      {
        category: 'Food',
        unit: 'packets',
        available: foodAvailable,
        demand: foodDemand,
        gap:
          foodAvailable !== null &&
          foodDemand !== null
            ? foodAvailable - foodDemand
            : null,
        status: deriveCategoryStatus(
          foodAvailable,
          foodDemand
        ),
      },

      {
        category: 'Medical',
        unit: 'kits',
        available: medicalAvailable,
        demand: medicalDemand,
        gap:
          medicalAvailable !== null &&
          medicalDemand !== null
            ? medicalAvailable - medicalDemand
            : null,
        status: deriveCategoryStatus(
          medicalAvailable,
          medicalDemand
        ),
      },

      {
        category: 'Water',
        unit: 'liters',
        available: waterAvailable,
        demand: waterDemand,
        gap:
          waterAvailable !== null &&
          waterDemand !== null
            ? waterAvailable - waterDemand
            : null,
        status: deriveCategoryStatus(
          waterAvailable,
          waterDemand
        ),
      },
    ];

    return {
      zone_id: zone.id,
      name: zone.name,
      boundary_json: zone.boundary_json,
      categories,
      overallStatus:
        deriveOverallStatus(categories),
      hasDemandData,
      hasSupplyData,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CreateDispatchPayload {
  incidentId: string;
  assignedUserId: string;
  resourceId?: string;
  notes: string;

  // Optional resource selected by officer
  resourceId?: string;
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

  isCrisisMode: boolean;
  setIsCrisisMode: (isCrisis: boolean) => void;
}

const OfficerContext =
  createContext<OfficerContextType | undefined>(
    undefined
  );

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const OfficerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();

  // ───────────────────────────────────────────────────────────────────────────
  // INCIDENTS
  // ───────────────────────────────────────────────────────────────────────────

  const {
    data: liveIncidents,
    isLoading: isLoadingIncidents,
    isError: isErrorIncidents,
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: getIncidents,
    refetchInterval: 15000,
  });

  const incidents = liveIncidents ?? [];

  // ───────────────────────────────────────────────────────────────────────────
  // RISK ZONES
  // ───────────────────────────────────────────────────────────────────────────

  const {
    data: liveRiskZones,
    isLoading: isLoadingRisk,
    isError: isErrorRisk,
  } = useQuery({
    queryKey: ['risk_zones'],

    queryFn: async () => {
  updateIncidentStatus: (
    id: string,
    status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
  ) => Promise<void>;

  createDispatch: (
    payload: CreateDispatchPayload
  ) => Promise<Dispatch | null>;
      return merged;
    },

    refetchInterval: 30000,
  });

  const riskZones = liveRiskZones ?? [];

  // ───────────────────────────────────────────────────────────────────────────
  // RESOURCES
  // ───────────────────────────────────────────────────────────────────────────

  const {
    data: liveResources,
    isLoading: isLoadingResources,
    isError: isErrorResources,
  } = useQuery({
    queryKey: ['resources'],
    queryFn: getResources,
    refetchInterval: 30000,
  });

  const resources = liveResources ?? [];

  // ───────────────────────────────────────────────────────────────────────────
  // ZONE PRESSURE
  // ───────────────────────────────────────────────────────────────────────────

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

      const demandMap =
        new Map<string, ZoneDemandResponse>();

      const demandResults =
        await Promise.allSettled(
          zones.map((z) =>
            getZoneDemand(z.id)
          )
        );

      demandResults.forEach(
        (result, idx) => {
          if (
            result.status === 'fulfilled'
          ) {
            demandMap.set(
              zones[idx].id,
              result.value
            );
          }
        }
      );

      const cachedResources =
        queryClient.getQueryData<
          Resource[]
        >(['resources']) ?? [];

      return buildPressureModels(
        zones,
        cachedResources,
        demandMap
      );
    },

    enabled: !isLoadingResources,
    staleTime: 60000,
  });

  const zonePressure =
    liveZonePressure ?? [];

  // ── Dispatches query (Issue 1 fix) ─────────────────────────────────────────
  const {
    data: liveDispatches,
    isLoading: isLoadingDispatches,
    isError: isErrorDispatches,
  } = useQuery({
    queryKey: ['dispatches'],
    queryFn: getDispatches,
  });

  const dispatches = liveDispatches ?? [];

  const [selectedIncidentId, setSelectedIncidentId] =
    useState<string | null>(null);

  const [selectedZoneId, setSelectedZoneId] =
    useState<string | null>(null);

  const [isCrisisMode, setIsCrisisMode] =
    useState<boolean>(false);

  // ───────────────────────────────────────────────────────────────────────────
  // LOCAL STATE
  // ───────────────────────────────────────────────────────────────────────────

  const [dispatches, setDispatches] =
    useState<Dispatch[]>([]);

  const [
    selectedIncidentId,
    setSelectedIncidentId,
  ] = useState<string | null>(null);

  const [
    selectedZoneId,
    setSelectedZoneId,
  ] = useState<string | null>(null);

  const [
    isCrisisMode,
    setIsCrisisMode,
  ] = useState<boolean>(false);

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD DISPATCHES FROM BACKEND
  // ───────────────────────────────────────────────────────────────────────────

  const refreshDispatches =
    async () => {
      try {
        console.log(
          '[OfficerContext] Loading dispatches...'
        );

        const backendDispatches =
          await getDispatches();

        console.log(
          '[OfficerContext] Backend dispatches:',
          backendDispatches
        );

        setDispatches(
          backendDispatches ?? []
        );

        return backendDispatches ?? [];
      } catch (error) {
        console.error(
          '[OfficerContext] Failed to load dispatches:',
          error
        );

        return [];
      }
    };

  // Initial load
  useEffect(() => {
    refreshDispatches();
  }, []);

  // Keep Officer dispatch queue synchronized
  useEffect(() => {
    const interval =
      setInterval(() => {
        refreshDispatches();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL INCIDENT
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (
      incidents.length > 0 &&
      !selectedIncidentId
    ) {
      setSelectedIncidentId(
        incidents[0].id
      );
    }
  }, [
    incidents,
    selectedIncidentId,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // WEBSOCKET
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleIncidentEvent = (payload: any) => {
      if (!payload) return;

      queryClient.setQueryData<Incident[]>(
        ['incidents'],
        (old) => {
          if (!old) return old;

          const exists = old.some(
            (i) => i.id === payload.id
          );

          const updatedList = exists
            ? old.map((i) =>
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

    const wsUrl =
      import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL
            .replace(/^http/, 'ws') +
          '/ws/dashboard'
        : 'ws://localhost:8000/ws/dashboard';

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWs = () => {
      const token =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('token')
          : null;

      if (!token) {
        console.warn(
          '[OfficerContext] No authentication token found for WebSocket.'
        );
        return;
      }

      const url =
        `${wsUrl}?token=${encodeURIComponent(token)}`;

      console.log(
        '[OfficerContext] Connecting WebSocket:',
        url
      );

      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(
          '[OfficerContext] WebSocket connected.'
        );
      };

      ws.onmessage = (event) => {
        try {
          if (
            typeof event.data === 'string' &&
            event.data.startsWith('ACK:')
          ) {
            return;
          }

          const data = JSON.parse(event.data);

          console.log(
            '[OfficerContext] WS event:',
            data
          );

          // INCIDENT EVENTS
          if (
            data.type === 'incident.created' ||
            data.type === 'incident.verified'
          ) {
            handleIncidentEvent(data.payload);
          }

          // RESOURCE EVENTS
          if (data.type === 'resource.updated') {
            queryClient.invalidateQueries({
              queryKey: ['resources'],
            });

            queryClient.invalidateQueries({
              queryKey: ['zone_pressure'],
            });
          }

          // DISPATCH EVENTS
          if (
            data.type === 'dispatch.created' ||
            data.type === 'dispatch.authorized' ||
            data.type === 'dispatch.status_changed'
          ) {
            refreshDispatches();
          }
        } catch (error) {
          console.error(
            '[OfficerContext] WebSocket parse error:',
            error
          );
        }
      };

      ws.onerror = (error) => {
        console.error(
          '[OfficerContext] WebSocket error:',
          error
        );
      };

      ws.onclose = (event: CloseEvent) => {
        console.warn(
          '[OfficerContext] WebSocket closed:',
          event.code
        );

        if (
          event.code === 4401 ||
          event.code === 4403
        ) {
          return;
        }

        reconnectTimer = setTimeout(
          connectWs,
          5000
        );
      };
    };

    const handleResourceUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['zone_pressure'] });
    };

    const handleDispatchEvent = () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
    };

    const unsubCreated = realtimeClient.subscribe('incident.created', handleIncidentEvent);
    const unsubVerified = realtimeClient.subscribe('incident.verified', handleIncidentEvent);
    const unsubUpdated = realtimeClient.subscribe('incident.updated', handleIncidentEvent);
    const unsubResource = realtimeClient.subscribe('resource.updated', handleResourceUpdated);
    const unsubDispatchAuth = realtimeClient.subscribe('dispatch.authorized', handleDispatchEvent);
    const unsubDispatchStatus = realtimeClient.subscribe('dispatch.status_changed', handleDispatchEvent);

    return () => {
      unsubCreated();
      unsubVerified();
      unsubUpdated();
      unsubResource();
      unsubDispatchAuth();
      unsubDispatchStatus();
    };
  }, [queryClient]);

  const updateIncidentStatus = async (
    id: string,
    status: Extract<IncidentStatus, 'acknowledged' | 'resolved'>
  ) => {
    const updatedIncident = await persistIncidentStatus(id, status);

    if (!updatedIncident) return;

    queryClient.setQueryData<Incident[]>(
      ['incidents'],
      (old) => {
        if (!old) return old;

        return old.map((incident) =>
          incident.id === id
            ? updatedIncident
            : incident
        );
      }
    );
  };

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

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

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

        isCrisisMode,
        setIsCrisisMode,
      }}
    >
      {children}
    </OfficerContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export const useOfficerContext =
  (): OfficerContextType => {
    const context =
      useContext(OfficerContext);

    if (!context) {
      throw new Error(
        'useOfficerContext must be used within an OfficerProvider'
      );
    }

    return context;
  };